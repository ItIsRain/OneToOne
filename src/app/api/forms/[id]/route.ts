import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";

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

// GET - Fetch a single form
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: form, error } = await supabase
      .from("forms")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Get form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update a form
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check plan feature access for forms
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const formsAccess = checkFeatureAccess(planInfo.planType, "forms");
    if (!formsAccess.allowed) {
      return NextResponse.json(
        {
          error: formsAccess.reason,
          upgrade_required: formsAccess.upgrade_required,
          feature: "forms",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "title",
      "description",
      "slug",
      "status",
      "fields",
      "conditional_rules",
      "settings",
      "thank_you_title",
      "thank_you_message",
      "thank_you_redirect_url",
      "auto_create_lead",
      "auto_create_contact",
      "lead_field_mapping",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: form, error } = await supabase
      .from("forms")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select("*")
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a form
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from("forms")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
