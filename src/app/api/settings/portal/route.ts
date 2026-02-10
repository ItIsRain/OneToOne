import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch portal settings for current tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("tenant_portal_settings")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Fetch portal settings error:", settingsError);
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    // Return defaults if no settings exist
    if (!settings) {
      return NextResponse.json({
        settings: {
          id: null,
          hero_headline: null,
          hero_subtitle: null,
          banner_image_url: null,
          show_events: true,
          featured_event_ids: [],
          custom_cta_text: null,
          custom_cta_url: null,
          hero_layout: "centered",
          show_about_section: false,
          about_heading: null,
          about_body: null,
          show_testimonials: false,
          testimonials: [],
          secondary_cta_text: null,
          secondary_cta_url: null,
          show_footer: true,
          footer_text: null,
          section_order: ["hero", "events", "about", "testimonials", "services", "faq", "cta_banner", "stats", "partners"],
          portal_accent_color: null,
          show_services: false,
          services_heading: null,
          services_subheading: null,
          services: [],
          show_faq: false,
          faq_heading: null,
          faq_items: [],
          show_cta_banner: false,
          cta_banner_heading: null,
          cta_banner_body: null,
          cta_banner_button_text: null,
          cta_banner_button_url: null,
          show_stats: false,
          stats_heading: null,
          stats: [],
          show_partners: false,
          partners_heading: null,
          partners: [],
          login_methods: ["password", "magic_link"],
          login_welcome_message: null,
          require_approval_comment: false,
          approval_notification_email: null,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get portal settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Save portal settings
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      hero_headline,
      hero_subtitle,
      banner_image_url,
      show_events,
      featured_event_ids,
      custom_cta_text,
      custom_cta_url,
      hero_layout,
      show_about_section,
      about_heading,
      about_body,
      show_testimonials,
      testimonials,
      secondary_cta_text,
      secondary_cta_url,
      show_footer,
      footer_text,
      section_order,
      portal_accent_color,
      show_services,
      services_heading,
      services_subheading,
      services,
      show_faq,
      faq_heading,
      faq_items,
      show_cta_banner,
      cta_banner_heading,
      cta_banner_body,
      cta_banner_button_text,
      cta_banner_button_url,
      show_stats,
      stats_heading,
      stats,
      show_partners,
      partners_heading,
      partners,
      login_methods,
      login_welcome_message,
      require_approval_comment,
      approval_notification_email,
    } = body;

    const settingsData = {
      tenant_id: profile.tenant_id,
      hero_headline: hero_headline || null,
      hero_subtitle: hero_subtitle || null,
      banner_image_url: banner_image_url || null,
      show_events: show_events !== false,
      featured_event_ids: featured_event_ids || [],
      custom_cta_text: custom_cta_text || null,
      custom_cta_url: custom_cta_url || null,
      hero_layout: hero_layout || "centered",
      show_about_section: show_about_section === true,
      about_heading: about_heading || null,
      about_body: about_body || null,
      show_testimonials: show_testimonials === true,
      testimonials: testimonials || [],
      secondary_cta_text: secondary_cta_text || null,
      secondary_cta_url: secondary_cta_url || null,
      show_footer: show_footer !== false,
      footer_text: footer_text || null,
      section_order: section_order || ["hero", "events", "about", "testimonials", "services", "faq", "cta_banner", "stats", "partners"],
      portal_accent_color: portal_accent_color || null,
      show_services: show_services === true,
      services_heading: services_heading || null,
      services_subheading: services_subheading || null,
      services: services || [],
      show_faq: show_faq === true,
      faq_heading: faq_heading || null,
      faq_items: faq_items || [],
      show_cta_banner: show_cta_banner === true,
      cta_banner_heading: cta_banner_heading || null,
      cta_banner_body: cta_banner_body || null,
      cta_banner_button_text: cta_banner_button_text || null,
      cta_banner_button_url: cta_banner_button_url || null,
      show_stats: show_stats === true,
      stats_heading: stats_heading || null,
      stats: stats || [],
      show_partners: show_partners === true,
      partners_heading: partners_heading || null,
      partners: partners || [],
      login_methods: login_methods || ["password", "magic_link"],
      login_welcome_message: login_welcome_message || null,
      require_approval_comment: require_approval_comment === true,
      approval_notification_email: approval_notification_email || null,
      updated_at: new Date().toISOString(),
    };

    // Check if settings already exist
    const { data: existing } = await supabase
      .from("tenant_portal_settings")
      .select("id")
      .eq("tenant_id", profile.tenant_id)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from("tenant_portal_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("tenant_portal_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Save portal settings error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: result.data, success: true });
  } catch (error) {
    console.error("Save portal settings error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
