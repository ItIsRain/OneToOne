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

// GET - Fetch all roles for the user's tenant
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

    // Fetch all roles
    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("is_system", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch roles error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get member counts for each role
    const rolesWithCounts = await Promise.all(
      (roles || []).map(async (role) => {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", profile.tenant_id)
          .eq("custom_role_id", role.id);

        return { ...role, member_count: count || 0 };
      })
    );

    return NextResponse.json({ roles: rolesWithCounts });
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new role
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

    // Only owners and admins can create roles
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const roleData = {
      tenant_id: currentProfile.tenant_id,
      name: body.name.trim(),
      description: body.description || null,
      permissions: body.permissions || [],
      is_system: false,
      is_default: body.is_default || false,
      color: body.color || "#6366f1",
      created_by: user.id,
    };

    // If setting as default, unset other defaults first
    if (roleData.is_default) {
      await supabase
        .from("roles")
        .update({ is_default: false })
        .eq("tenant_id", currentProfile.tenant_id)
        .eq("is_default", true);
    }

    const { data: role, error } = await supabase
      .from("roles")
      .insert(roleData)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role: { ...role, member_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
