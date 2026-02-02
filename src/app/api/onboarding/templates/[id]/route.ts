import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate steps structure if steps are being updated
    if (body.steps !== undefined) {
      if (!Array.isArray(body.steps) || body.steps.length === 0) {
        return NextResponse.json({ error: "At least one step is required" }, { status: 400 });
      }
      for (const step of body.steps) {
        if (!step.title?.trim()) {
          return NextResponse.json({ error: "Each step must have a title" }, { status: 400 });
        }
        if (!step.type) {
          return NextResponse.json({ error: "Each step must have a type" }, { status: 400 });
        }
      }
    }

    // If marking as default, unset other defaults first
    if (body.is_default) {
      await supabase
        .from("client_onboarding_templates")
        .update({ is_default: false })
        .eq("tenant_id", profile.tenant_id)
        .eq("is_default", true);
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.steps !== undefined) updateData.steps = body.steps;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    const { data: template, error } = await supabase
      .from("client_onboarding_templates")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Update onboarding template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("client_onboarding_templates")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete onboarding template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
