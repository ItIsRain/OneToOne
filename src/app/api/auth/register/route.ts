import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubdomainSuffix } from "@/lib/url";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, phone, useCase, subdomain, plan } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !useCase || !subdomain) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: "Invalid subdomain format" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if Supabase is configured (valid URL check)
    const isSupabaseConfigured = supabaseUrl &&
      supabaseServiceKey &&
      supabaseUrl.startsWith("http");

    if (!isSupabaseConfigured) {
      // Development mode - just log and return success
      console.log("[DEV] Registration:", {
        firstName,
        lastName,
        email,
        phone: phone || null,
        useCase,
        subdomain: `${subdomain}${getSubdomainSuffix()}`,
        plan: plan || "free",
      });
      return NextResponse.json({
        success: true,
        message: "Account created (dev mode)",
        subdomain: `${subdomain}${getSubdomainSuffix()}`,
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if subdomain is reserved
    const { data: reservedSubdomain } = await supabase
      .from("reserved_subdomains")
      .select("subdomain, reason")
      .eq("subdomain", subdomain.toLowerCase())
      .single();

    if (reservedSubdomain) {
      return NextResponse.json(
        { error: "This subdomain is reserved and cannot be used" },
        { status: 400 }
      );
    }

    // Check if subdomain is already taken
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Already verified via OTP
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
      phone: phone || undefined,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create tenant (organization)
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: `${firstName}'s Portal`,
        subdomain,
        owner_id: authData.user.id,
        use_case: useCase,
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant error:", tenantError);
      // Rollback: delete the user if tenant creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create portal" },
        { status: 500 }
      );
    }

    // Create user profile linked to tenant
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      role: "owner",
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Continue anyway - profile can be created later
    }

    // Create subscription for the tenant with selected plan
    const validPlans = ["free", "starter", "professional", "business"];
    const selectedPlan = validPlans.includes(plan) ? plan : "free";
    const periodDays = 30;
    const { error: subscriptionError } = await supabase.from("tenant_subscriptions").insert({
      tenant_id: tenant.id,
      plan_type: selectedPlan,
      status: "active",
      billing_interval: "monthly",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subscriptionError) {
      console.error("Subscription error:", subscriptionError);
      // Continue anyway - subscription can be created later
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      subdomain: `${subdomain}${getSubdomainSuffix()}`,
      tenantId: tenant.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
