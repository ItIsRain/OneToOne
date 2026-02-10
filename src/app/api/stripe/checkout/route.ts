import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

// Stripe Price IDs for each plan (you'll need to create these in Stripe Dashboard)
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "price_starter_yearly",
  },
  professional: {
    monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "price_professional_monthly",
    yearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || "price_professional_yearly",
  },
  business: {
    monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly",
    yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "price_business_yearly",
  },
};

type PlanType = "starter" | "professional" | "business";
type BillingInterval = "monthly" | "yearly";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const supabase = await createClient();

    const body = await request.json();
    const { planType: rawPlanType, billingInterval: rawBillingInterval } = body;

    if (!rawPlanType || !["starter", "professional", "business"].includes(rawPlanType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    if (!rawBillingInterval || !["monthly", "yearly"].includes(rawBillingInterval)) {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }

    const planType = rawPlanType as PlanType;
    const billingInterval = rawBillingInterval as BillingInterval;

    // Get user's profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get tenant info and check if user has used trial
    const [tenantResult, subscriptionResult, billingHistoryResult] = await Promise.all([
      supabase
        .from("tenants")
        .select("name, stripe_customer_id")
        .eq("id", profile.tenant_id)
        .single(),
      supabase
        .from("tenant_subscriptions")
        .select("stripe_subscription_id")
        .eq("tenant_id", profile.tenant_id)
        .single(),
      supabase
        .from("billing_history")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id),
    ]);

    const tenant = tenantResult.data;
    const hasUsedTrial = (billingHistoryResult.count || 0) > 0 || !!subscriptionResult.data?.stripe_subscription_id;

    // Get or create Stripe customer
    let stripeCustomerId = tenant?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: tenant?.name || `${profile.first_name} ${profile.last_name}`,
        metadata: {
          tenant_id: profile.tenant_id,
          user_id: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save the customer ID
      await supabase
        .from("tenants")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", profile.tenant_id);
    }

    // Get the price ID for the selected plan
    const planPrices = STRIPE_PRICE_IDS[planType];
    const priceId = planPrices[billingInterval];

    // Check if price ID is a placeholder (not configured)
    if (priceId.startsWith("price_") && !priceId.startsWith("price_1")) {
      console.error(`Stripe price ID not configured for ${planType} ${billingInterval}. Please set STRIPE_${planType.toUpperCase()}_${billingInterval.toUpperCase()}_PRICE_ID environment variable.`);
      return NextResponse.json(
        {
          error: "Payment system not configured. Please contact support.",
          details: "Stripe price IDs need to be configured in environment variables."
        },
        { status: 503 }
      );
    }

    // Get the app URL with fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard/settings/billing?success=true&plan=${planType}`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
      metadata: {
        tenant_id: profile.tenant_id,
        plan_type: planType,
        billing_interval: billingInterval,
      },
      subscription_data: {
        // Only offer trial if user hasn't used it before
        ...(hasUsedTrial ? {} : { trial_period_days: 7 }),
        metadata: {
          tenant_id: profile.tenant_id,
          plan_type: planType,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
