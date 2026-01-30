import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { checkTriggers } from "@/lib/workflows/triggers";

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

// GET - Fetch all forms for the user's tenant
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

    const { data: forms, error } = await supabase
      .from("forms")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Get forms error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new form
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

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Auto-generate slug from title if not provided
    const baseSlug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    const formData = {
      tenant_id: profile.tenant_id,
      created_by: user.id,
      title: body.title,
      description: body.description || null,
      slug,
      status: body.status || "draft",
      fields: body.fields || [],
      conditional_rules: body.conditional_rules || [],
      settings: body.settings || {},
      thank_you_title: body.thank_you_title || null,
      thank_you_message: body.thank_you_message || null,
      thank_you_redirect_url: body.thank_you_redirect_url || null,
      auto_create_lead: body.auto_create_lead || false,
      auto_create_contact: body.auto_create_contact || false,
      lead_field_mapping: body.lead_field_mapping || null,
      submissions_count: 0,
    };

    const { data: form, error } = await supabase
      .from("forms")
      .insert(formData)
      .select("*")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for form_created
    if (form && profile.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("form_created", {
            entity_id: form.id,
            entity_type: "form",
            entity_name: form.title,
            form_title: form.title,
            form_slug: form.slug,
          }, serviceClient, profile.tenant_id, user.id);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
