import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

// POST - Cancel subscription in Stripe (cancel at period end)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("stripe_subscription_id, plan_type")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active Stripe subscription found" },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe at period end
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local DB to reflect
    await supabase
      .from("tenant_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", profile.tenant_id);

    return NextResponse.json({
      success: true,
      message: "Subscription will cancel at end of billing period",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

// DELETE - Reactivate subscription (remove cancellation)
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("stripe_subscription_id")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active Stripe subscription found" },
        { status: 400 }
      );
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update local DB
    await supabase
      .from("tenant_subscriptions")
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", profile.tenant_id);

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated",
    });
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
