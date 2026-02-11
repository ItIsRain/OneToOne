import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateRoleSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch single role with members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
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

    // Fetch role
    const { data: role, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get members with this role
    const { data: members, count } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, job_title, status", { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .eq("custom_role_id", id)
      .order("first_name", { ascending: true })
      .limit(10);

    return NextResponse.json({
      role: {
        ...role,
        member_count: count || 0,
        members: members || [],
      },
    });
  } catch (error) {
    console.error("Get role error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
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

    // Only owners and admins can update roles
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if role exists and is not a system role
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id, is_system")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole.is_system) {
      return NextResponse.json(
        { error: "System roles cannot be modified" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateRoleSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Build update object
    const allowedFields = ["name", "description", "permissions", "color", "is_default"];
    const updates: Record<string, unknown> = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // If setting as default, unset other defaults first
    if (updates.is_default === true) {
      await supabase
        .from("roles")
        .update({ is_default: false })
        .eq("tenant_id", currentProfile.tenant_id)
        .eq("is_default", true)
        .neq("id", id);
    }

    updates.updated_at = new Date().toISOString();

    const { data: role, error } = await supabase
      .from("roles")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get member count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", currentProfile.tenant_id)
      .eq("custom_role_id", id);

    return NextResponse.json({ role: { ...role, member_count: count || 0 } });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete role
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
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

    // Only owners and admins can delete roles
    if (!["owner", "admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if role exists and is not a system role
    const { data: existingRole } = await supabase
      .from("roles")
      .select("id, is_system, name")
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id)
      .single();

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole.is_system) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 400 }
      );
    }

    // Check if any members have this role
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", currentProfile.tenant_id)
      .eq("custom_role_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete role "${existingRole.name}" because ${count} member(s) have this role. Please reassign them first.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id)
      .eq("tenant_id", currentProfile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete role error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
