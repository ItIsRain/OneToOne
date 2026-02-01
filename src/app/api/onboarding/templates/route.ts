import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const { data: templates, error } = await supabase
      .from("client_onboarding_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Get onboarding templates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    if (!Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json({ error: "At least one step is required" }, { status: 400 });
    }

    // Validate steps structure
    for (const step of body.steps) {
      if (!step.title?.trim()) {
        return NextResponse.json({ error: "Each step must have a title" }, { status: 400 });
      }
      if (!step.type) {
        return NextResponse.json({ error: "Each step must have a type" }, { status: 400 });
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

    const { data: template, error } = await supabase
      .from("client_onboarding_templates")
      .insert({
        tenant_id: profile.tenant_id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        steps: body.steps,
        is_default: body.is_default || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create onboarding template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
