import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, createRoleSchema } from "@/lib/validations";
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

// GET - Fetch all roles for the user's tenant
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

    // Fetch roles and member counts in parallel (avoid N+1)
    const [rolesResult, profilesResult] = await Promise.all([
      supabase
        .from("roles")
        .select("id, name, description, permissions, is_system, is_default, color, created_at")
        .eq("tenant_id", profile.tenant_id)
        .order("is_system", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("custom_role_id")
        .eq("tenant_id", profile.tenant_id)
        .not("custom_role_id", "is", null),
    ]);

    if (rolesResult.error) {
      console.error("Fetch roles error:", rolesResult.error);
      return NextResponse.json({ error: rolesResult.error.message }, { status: 500 });
    }

    // Count members per role in-memory (much faster than N+1 queries)
    const roleCounts = new Map<string, number>();
    (profilesResult.data || []).forEach((p) => {
      if (p.custom_role_id) {
        roleCounts.set(p.custom_role_id, (roleCounts.get(p.custom_role_id) || 0) + 1);
      }
    });

    const rolesWithCounts = (rolesResult.data || []).map((role) => ({
      ...role,
      member_count: roleCounts.get(role.id) || 0,
    }));

    const response = NextResponse.json({ roles: rolesWithCounts });
    // Cache for 30 seconds - roles don't change often
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("Get roles error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new role
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
      .select("tenant_id, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only owners and admins can create roles
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createRoleSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const roleData = {
      tenant_id: currentProfile.tenant_id,
      name: body.name.trim(),
      description: body.description || null,
      permissions: body.permissions || [],
      is_system: false,
      is_default: body.is_default || false,
      color: body.color || "#6366f1",
      created_by: userId,
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
