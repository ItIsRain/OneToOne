import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET - Fetch invite details by token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch invite by token
    const { data: invite, error } = await supabase
      .from("team_invites")
      .select(`
        *,
        tenant:tenants(id, name)
      `)
      .eq("invite_token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    // Check if invite is expired
    if (new Date(invite.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Check if invite is still pending
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invitation is no longer valid" }, { status: 410 });
    }

    // Return invite details (without sensitive info)
    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        first_name: invite.first_name,
        last_name: invite.last_name,
        role: invite.role,
        job_title: invite.job_title,
        department: invite.department,
        tenant_name: invite.tenant?.name || "Team",
      },
    });
  } catch (error) {
    console.error("Get invite error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Accept invite and create account
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("invite_token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    // Check if invite is expired
    if (new Date(invite.invite_expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("team_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === invite.email);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: invite.first_name,
        last_name: invite.last_name,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      tenant_id: invite.tenant_id,
      first_name: invite.first_name,
      last_name: invite.last_name,
      email: invite.email,
      phone: invite.phone,
      job_title: invite.job_title,
      department: invite.department,
      employment_type: invite.employment_type,
      start_date: invite.start_date,
      role: invite.role,
      custom_role_id: invite.custom_role_id,
      manager_id: invite.manager_id,
      hourly_rate: invite.hourly_rate,
      skills: invite.skills,
      timezone: invite.timezone,
      notes: invite.notes,
      linkedin_url: invite.linkedin_url,
      tags: invite.tags,
      status: "active",
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Rollback: delete the user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    // Mark invite as accepted
    await supabase
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
