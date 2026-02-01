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

// GET - Fetch dashboard settings for current tenant
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("tenant_dashboard_settings")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Fetch dashboard settings error:", settingsError);
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    // Return defaults if no settings exist
    if (!settings) {
      return NextResponse.json({
        settings: {
          id: null,
          show_greeting: true,
          show_metrics: true,
          show_quick_actions: true,
          show_onboarding: true,
          show_activity: true,
          show_upcoming: true,
          show_announcements: true,
          show_goals: true,
          show_bookmarks: true,
          widget_order: ["greeting","metrics","quick_actions","onboarding","activity","upcoming","announcements","goals","bookmarks"],
          accent_color: null,
          banner_image_url: null,
          banner_message: null,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get dashboard settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Save dashboard settings
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      show_greeting,
      show_briefing,
      show_metrics,
      show_quick_actions,
      show_onboarding,
      show_activity,
      show_upcoming,
      show_announcements,
      show_goals,
      show_bookmarks,
      show_scope_creep,
      show_client_health,
      show_resource_heatmap,
      show_client_journey,
      show_business_health,
      widget_order,
      accent_color,
      banner_image_url,
      banner_message,
    } = body;

    const settingsData = {
      tenant_id: profile.tenant_id,
      show_greeting: show_greeting !== false,
      show_briefing: show_briefing !== false,
      show_metrics: show_metrics !== false,
      show_quick_actions: show_quick_actions !== false,
      show_onboarding: show_onboarding !== false,
      show_activity: show_activity !== false,
      show_upcoming: show_upcoming !== false,
      show_announcements: show_announcements !== false,
      show_goals: show_goals !== false,
      show_bookmarks: show_bookmarks !== false,
      show_scope_creep: show_scope_creep !== false,
      show_client_health: show_client_health !== false,
      show_resource_heatmap: show_resource_heatmap !== false,
      show_client_journey: show_client_journey !== false,
      show_business_health: show_business_health !== false,
      widget_order: widget_order || ["greeting","briefing","metrics","quick_actions","onboarding","resource_heatmap","client_journey","business_health","activity","upcoming","client_health","announcements","goals","bookmarks","scope_creep"],
      accent_color: accent_color || null,
      banner_image_url: banner_image_url || null,
      banner_message: banner_message || null,
      updated_at: new Date().toISOString(),
    };

    // Check if settings already exist
    const { data: existing } = await supabase
      .from("tenant_dashboard_settings")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from("tenant_dashboard_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("tenant_dashboard_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Save dashboard settings error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: result.data, success: true });
  } catch (error) {
    console.error("Save dashboard settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
