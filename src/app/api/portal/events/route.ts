import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantIdFromRequest } from "@/hooks/useTenantFromHeaders";

// Public API — no auth required
export async function GET(request: Request) {
  try {
    const tenantId = getTenantIdFromRequest(request);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: events, error } = await serviceClient
      .from("events")
      .select("id, slug, title, description, start_date, end_date, location, is_virtual, cover_image, category, event_type, ticket_price, attendees_count")
      .eq("tenant_id", tenantId)
      .or("is_public.is.null,is_public.eq.true")
      .or("is_published.is.null,is_published.eq.true")
      .neq("status", "cancelled")
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Fetch portal events error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error("Portal events error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
