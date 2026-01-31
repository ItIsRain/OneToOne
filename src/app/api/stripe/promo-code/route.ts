import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

const COUPON_ID = "UPGRADE50_FIRST_MONTH";

/**
 * POST /api/stripe/promo-code
 * Generates a unique Stripe promotion code (50% off first month)
 * for the current tenant. Returns the existing code if already created.
 */
export async function POST() {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Check current plan — only generate for free plan users
    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("plan_type")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (subscription && subscription.plan_type !== "free") {
      return NextResponse.json(
        { error: "Promo code is only available for free plan users" },
        { status: 400 }
      );
    }

    // Ensure the coupon exists in Stripe (50% off, once, first month)
    try {
      await stripe.coupons.retrieve(COUPON_ID);
    } catch {
      // Coupon doesn't exist yet — create it
      await stripe.coupons.create({
        id: COUPON_ID,
        percent_off: 50,
        duration: "once",
        name: "50% Off Your First Month",
        max_redemptions: 10000,
      });
    }

    // Check if this tenant already has a promo code
    const existingCodes = await stripe.promotionCodes.list({
      coupon: COUPON_ID,
      limit: 100,
    });

    const tenantCode = existingCodes.data.find(
      (pc) => pc.metadata?.tenant_id === profile.tenant_id
    );

    if (tenantCode) {
      return NextResponse.json({ code: tenantCode.code });
    }

    // Generate a unique promo code for this tenant
    const suffix = profile.tenant_id.replace(/-/g, "").slice(0, 6).toUpperCase();
    const code = `SAVE50-${suffix}`;

    const promoCode = await stripe.promotionCodes.create({
      promotion: { coupon: COUPON_ID, type: "coupon" },
      code,
      max_redemptions: 1,
      metadata: {
        tenant_id: profile.tenant_id,
      },
    });

    return NextResponse.json({ code: promoCode.code });
  } catch (error) {
    console.error("Error generating promo code:", error);
    return NextResponse.json(
      { error: "Failed to generate promo code" },
      { status: 500 }
    );
  }
}
