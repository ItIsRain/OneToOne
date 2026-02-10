import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// Hardcoded discount codes
const DISCOUNT_CODES: Record<string, { discount_percent: number }> = {
  "LUNARLIMITED": { discount_percent: 100 },
};

// POST - Subscribe to a plan
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { plan_type, billing_interval, discount_code } = body;

    if (!plan_type || !["free", "starter", "professional", "business"].includes(plan_type)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Get user's profile to find tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;
    const interval = billing_interval || "monthly";

    // Calculate pricing
    const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
      free: { monthly: 0, yearly: 0 },
      starter: { monthly: 29, yearly: 279 },
      professional: { monthly: 79, yearly: 758 },
      business: { monthly: 199, yearly: 1910 },
    };

    const originalPrice = PLAN_PRICES[plan_type][interval as "monthly" | "yearly"];
    let finalPrice = originalPrice;
    let appliedDiscount = null;

    // Apply discount if provided
    if (discount_code) {
      const upperCode = discount_code.toUpperCase().trim();
      const discount = DISCOUNT_CODES[upperCode];
      if (discount) {
        finalPrice = originalPrice - (originalPrice * discount.discount_percent) / 100;
        appliedDiscount = {
          code: upperCode,
          percent: discount.discount_percent,
        };
      }
    }

    // For free plans or 100% discount, no payment needed
    const requiresPayment = finalPrice > 0 && plan_type !== "free";

    if (requiresPayment) {
      // In production, this would redirect to Stripe checkout
      // For now, we'll just create the subscription as pending payment
      return NextResponse.json({
        success: false,
        requires_payment: true,
        amount: finalPrice,
        message: "Payment integration coming soon. Use discount code LUNARLIMITED for 100% off!",
      });
    }

    // Calculate period dates
    const periodDays = interval === "yearly" ? 365 : 30;
    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from("tenant_subscriptions")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    let subscription;

    if (existingSub) {
      // Update existing subscription
      const { data: updatedSub, error } = await supabase
        .from("tenant_subscriptions")
        .update({
          plan_type,
          billing_interval: interval,
          status: "active",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: false,
          discount_code: appliedDiscount?.code || null,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }
      subscription = updatedSub;
    } else {
      // Create new subscription
      const { data: newSub, error } = await supabase
        .from("tenant_subscriptions")
        .insert({
          tenant_id: tenantId,
          plan_type,
          billing_interval: interval,
          status: "active",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          discount_code: appliedDiscount?.code || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
      }
      subscription = newSub;
    }

    // Add to billing history if it was a paid plan with discount
    if (appliedDiscount && originalPrice > 0) {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("billing_history").insert({
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        amount: 0,
        original_amount: originalPrice,
        currency: "USD",
        discount_code: appliedDiscount.code,
        discount_percent: appliedDiscount.percent,
        description: `${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} plan - ${interval}ly (100% discount applied)`,
        status: "paid",
        paid_at: new Date().toISOString(),
      });
    }

    const res = NextResponse.json({
      success: true,
      subscription,
      applied_discount: appliedDiscount,
      message: `Successfully subscribed to ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} plan!`,
    });
    // Clear the middleware subscription cache so it re-validates on next dashboard visit
    res.cookies.set("1i1_sub_ok", "", { path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
