import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get company settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get tenant/company settings
    const { data: company, error } = await supabase
      .from("tenants")
      .select(`
        id,
        name,
        subdomain,
        logo_url,
        primary_color,
        description,
        industry,
        company_size,
        founded_year,
        website,
        business_email,
        phone,
        address_street,
        address_city,
        address_state,
        address_country,
        address_postal_code,
        tax_id,
        registration_number,
        currency,
        timezone,
        date_format,
        fiscal_year_start,
        social_linkedin,
        social_twitter,
        social_instagram,
        social_facebook,
        created_at,
        updated_at
      `)
      .eq("id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching company settings:", error);
      return NextResponse.json({ error: "Failed to fetch company settings" }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error in GET company settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update company settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Define allowed fields to update
    const allowedFields = [
      "name",
      "logo_url",
      "primary_color",
      "description",
      "industry",
      "company_size",
      "founded_year",
      "website",
      "business_email",
      "phone",
      "address_street",
      "address_city",
      "address_state",
      "address_country",
      "address_postal_code",
      "tax_id",
      "registration_number",
      "currency",
      "timezone",
      "date_format",
      "fiscal_year_start",
      "social_linkedin",
      "social_twitter",
      "social_instagram",
      "social_facebook",
    ];

    // Filter body to only include allowed fields
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update company settings
    const { data: company, error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating company settings:", error);
      return NextResponse.json({ error: "Failed to update company settings" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company,
      message: "Company settings updated successfully"
    });
  } catch (error) {
    console.error("Error in PATCH company settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
