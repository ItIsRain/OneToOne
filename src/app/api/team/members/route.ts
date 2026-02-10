import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkTeamMemberLimit } from "@/lib/plan-limits";
import { sendTeamInviteEmail } from "@/lib/email";
import { validateBody, createTeamMemberSchema } from "@/lib/validations";
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

// GET - Fetch all team members for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile not found. Please complete your profile setup." }, { status: 400 });
    }

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found. Please complete your registration." }, { status: 400 });
    }

    // Fetch all team members with custom role
    const { data: members, error } = await supabase
      .from("profiles")
      .select(`
        *,
        custom_role:roles(id, name, color, permissions)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch members error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch manager info separately for members that have a manager_id
    const managerIds = [...new Set(members?.filter(m => m.manager_id).map(m => m.manager_id) || [])];
    let managersMap: Record<string, { id: string; first_name: string; last_name: string | null; email: string; avatar_url: string | null }> = {};

    if (managerIds.length > 0) {
      const { data: managers } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .in("id", managerIds);

      if (managers) {
        managersMap = managers.reduce((acc, m) => {
          acc[m.id] = m;
          return acc;
        }, {} as typeof managersMap);
      }
    }

    // Attach manager info to members
    const membersWithManagers = members?.map(member => ({
      ...member,
      manager: member.manager_id ? managersMap[member.manager_id] || null : null,
      is_invite: false,
    })) || [];

    // Fetch pending invites
    const { data: invites } = await supabase
      .from("team_invites")
      .select(`
        *,
        custom_role:roles(id, name, color)
      `)
      .eq("tenant_id", profile.tenant_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Transform invites to look like members
    const invitesAsMembersList = (invites || []).map(invite => ({
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
      manager: invite.manager_id ? managersMap[invite.manager_id] || null : null,
      is_invite: true,
      invite_token: invite.invite_token,
      invite_expires_at: invite.invite_expires_at,
    }));

    // Combine members and invites
    const allMembers = [...membersWithManagers, ...invitesAsMembersList];

    return NextResponse.json({ members: allMembers });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Invite a new team member
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's profile with tenant_id and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, role, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get tenant name for the email
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", currentProfile.tenant_id)
      .single();

    // Check if user has permission to invite members
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check plan limits for team member creation
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const teamLimitCheck = await checkTeamMemberLimit(supabase, currentProfile.tenant_id, planInfo.planType);
    if (!teamLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: teamLimitCheck.reason,
          current: teamLimitCheck.current,
          limit: teamLimitCheck.limit,
          upgrade_required: teamLimitCheck.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createTeamMemberSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate invite token
    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days expiry

    // Check if email already exists in profiles
    const { data: existingMember } = await supabase
      .from("profiles")
      .select("id")
      .eq("tenant_id", currentProfile.tenant_id)
      .eq("email", body.email)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "A team member with this email already exists" },
        { status: 400 }
      );
    }

    // Check if there's any existing invite for this email (pending, cancelled, or expired)
    const { data: existingInvite } = await supabase
      .from("team_invites")
      .select("id, status")
      .eq("tenant_id", currentProfile.tenant_id)
      .eq("email", body.email)
      .single();

    // If there's a pending invite, don't allow re-invite
    if (existingInvite && existingInvite.status === "pending") {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Validate FK references belong to the same tenant
    if (body.manager_id) {
      const { data: manager } = await supabase
        .from("profiles").select("id").eq("id", body.manager_id).eq("tenant_id", currentProfile.tenant_id).single();
      if (!manager) {
        return NextResponse.json({ error: "Manager not found in your organization" }, { status: 404 });
      }
    }

    // Prepare invite data
    const inviteData = {
      tenant_id: currentProfile.tenant_id,
      first_name: body.first_name,
      last_name: body.last_name || null,
      email: body.email,
      phone: body.phone || null,
      job_title: body.job_title || null,
      department: body.department || null,
      employment_type: body.employment_type || "full-time",
      start_date: body.start_date || null,
      role: body.role || "member",
      custom_role_id: body.custom_role_id || null,
      manager_id: body.manager_id || null,
      hourly_rate: body.hourly_rate ? parseFloat(body.hourly_rate) : 0,
      skills: body.skills || [],
      timezone: body.timezone || "UTC",
      notes: body.notes || null,
      linkedin_url: body.linkedin_url || null,
      tags: body.tags || [],
      invite_token: inviteToken,
      invite_expires_at: inviteExpiresAt.toISOString(),
      invited_by: userId,
      status: "pending",
      updated_at: new Date().toISOString(),
    };

    let invite;
    let error;

    // If there's a cancelled/expired invite, update it instead of inserting
    if (existingInvite && (existingInvite.status === "cancelled" || existingInvite.status === "expired")) {
      const result = await supabase
        .from("team_invites")
        .update(inviteData)
        .eq("id", existingInvite.id)
        .select(`
          *,
          custom_role:roles(id, name, color)
        `)
        .single();
      invite = result.data;
      error = result.error;
    } else {
      // No existing invite, create a new one
      const result = await supabase
        .from("team_invites")
        .insert(inviteData)
        .select(`
          *,
          custom_role:roles(id, name, color)
        `)
        .single();
      invite = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch manager info if present
    let managerData = null;
    if (invite?.manager_id) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("id", invite.manager_id)
        .single();
      managerData = manager;
    }

    // Transform invite to look like a member for the frontend
    const member = {
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
      is_invite: true,
    };

    // Send invite email
    const inviterName = `${currentProfile.first_name} ${currentProfile.last_name || ""}`.trim();
    const inviteeName = `${invite.first_name} ${invite.last_name || ""}`.trim();
    const teamName = tenant?.name || "the team";

    const emailSent = await sendTeamInviteEmail({
      to: invite.email,
      inviteeName,
      inviterName,
      teamName,
      role: invite.role,
      inviteToken,
      tenantId: currentProfile.tenant_id,
    });

    if (!emailSent) {
      console.warn("Failed to send invite email to:", invite.email);
    }

    return NextResponse.json({
      member,
      inviteToken,
      emailSent,
    }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
