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

// GET - Fetch all team members for the user's tenant
export async function GET() {
  try {
    const supabase = await getSupabaseClient();

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
    })) || [];

    return NextResponse.json({ members: membersWithManagers });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Invite a new team member
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

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

    // Check if user has permission to invite members
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Generate invite token
    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 days expiry

    const memberData = {
      tenant_id: currentProfile.tenant_id,
      first_name: body.first_name,
      last_name: body.last_name || null,
      email: body.email,
      phone: body.phone || null,
      job_title: body.job_title || null,
      department: body.department || null,
      employment_type: body.employment_type || "full-time",
      start_date: body.start_date || null,
      status: "pending_invite",
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
      invited_by: user.id,
    };

    // Check if email already exists in this tenant
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

    // For now, create a placeholder profile (in production, you'd send an invite email)
    // The member will complete their profile when they accept the invite
    const { data: member, error } = await supabase
      .from("profiles")
      .insert({
        id: crypto.randomUUID(), // Temporary ID until they create their auth account
        ...memberData,
      })
      .select(`
        *,
        custom_role:roles(id, name, color)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch manager info if present
    let managerData = null;
    if (member?.manager_id) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("id", member.manager_id)
        .single();
      managerData = manager;
    }

    // TODO: Send invite email with inviteToken
    // For now, just return success

    return NextResponse.json({
      member: { ...member, manager: managerData },
      inviteToken
    }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
