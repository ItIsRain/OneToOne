import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// PUBLIC route - no auth required, uses service role client
// GET - Fetch public booking page data by slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Scope slug lookup to tenant if accessed via subdomain (x-tenant-id set by middleware)
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    // Look up booking page by slug where active
    let pageQuery = supabase
      .from("booking_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true);

    if (tenantId) {
      pageQuery = pageQuery.eq("tenant_id", tenantId);
    }

    const { data: bookingPage, error: pageError } = await pageQuery.single();

    if (pageError || !bookingPage) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    // Fetch availability — for assigned member, or fall back to tenant owner
    const memberId = bookingPage.assigned_member_id;
    let availabilityQuery = supabase
      .from("team_availability")
      .select("*")
      .eq("tenant_id", bookingPage.tenant_id)
      .eq("is_available", true);

    if (memberId) {
      availabilityQuery = availabilityQuery.eq("member_id", memberId);
    }

    const { data: availability } = await availabilityQuery;

    // If no availability found and no assigned member, fetch the tenant owner's availability
    let resolvedAvailability = availability;
    if ((!availability || availability.length === 0) && !memberId) {
      // Get tenant owner
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("owner_id")
        .eq("id", bookingPage.tenant_id)
        .single();

      if (tenantData?.owner_id) {
        const { data: ownerAvailability } = await supabase
          .from("team_availability")
          .select("*")
          .eq("tenant_id", bookingPage.tenant_id)
          .eq("member_id", tenantData.owner_id)
          .eq("is_available", true);

        resolvedAvailability = ownerAvailability;
      }
    }

    // Fetch availability overrides
    const today = new Date().toISOString().split("T")[0];
    let overridesQuery = supabase
      .from("availability_overrides")
      .select("*")
      .eq("tenant_id", bookingPage.tenant_id)
      .gte("override_date", today);

    if (memberId) {
      overridesQuery = overridesQuery.eq("member_id", memberId);
    }

    const { data: overrides } = await overridesQuery;

    // Fetch tenant branding info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, logo_url, subdomain")
      .eq("id", bookingPage.tenant_id)
      .single();

    // Remove tenant_id from public response
    const { tenant_id: _tenantId, ...publicBookingPage } = bookingPage;

    return NextResponse.json({
      bookingPage: publicBookingPage,
      availability: resolvedAvailability,
      overrides,
      tenant: tenant ? {
        name: tenant.name || null,
        logo_url: tenant.logo_url || null,
        subdomain: tenant.subdomain || null,
      } : null,
    });
  } catch (error) {
    console.error("Get public booking page error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
