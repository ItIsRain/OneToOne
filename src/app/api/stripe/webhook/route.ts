import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 29, yearly: 279 },
  professional: { monthly: 79, yearly: 758 },
  business: { monthly: 199, yearly: 1910 },
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe, supabase);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription, supabase);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, stripe, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, stripe, supabase);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: Stripe, supabase: SupabaseClient) {
  const tenantId = session.metadata?.tenant_id;
  const planType = session.metadata?.plan_type;
  const billingInterval = session.metadata?.billing_interval as "monthly" | "yearly";

  if (!tenantId || !planType) {
    console.error("Missing tenant_id or plan_type in session metadata");
    return;
  }

  // Get subscription details from Stripe
  const subscriptionId = session.subscription as string;

  // Copy metadata from session to subscription so future webhook events can access it
  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      tenant_id: tenantId,
      plan_type: planType,
      billing_interval: billingInterval,
    },
  });

  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData = subscriptionResponse as any;

  // Check if this is a trial subscription
  const isTrialing = subscriptionData.status === "trialing";

  // For trial subscriptions, use trial_end as the next billing date
  // For regular subscriptions, use current_period_end
  const periodStart = subscriptionData.current_period_start
    ? new Date(subscriptionData.current_period_start * 1000).toISOString()
    : new Date().toISOString();

  let periodEnd: string;
  if (isTrialing && subscriptionData.trial_end) {
    // Trial subscription - next billing is when trial ends
    periodEnd = new Date(subscriptionData.trial_end * 1000).toISOString();
  } else if (subscriptionData.current_period_end) {
    periodEnd = new Date(subscriptionData.current_period_end * 1000).toISOString();
  } else {
    // Fallback to 7 days for trial, 30 days for regular
    const days = isTrialing ? 7 : 30;
    periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      plan_type: planType,
      billing_interval: billingInterval,
      status: "active",
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      is_trial: isTrialing,
      trial_ends_at: isTrialing && subscriptionData.trial_end
        ? new Date(subscriptionData.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error updating subscription:", error);
  }

  // Create billing history record for the subscription start (trial or regular)
  const regularPrice = PLAN_PRICES[planType as keyof typeof PLAN_PRICES]?.[billingInterval] || 0;

  const { error: historyError } = await supabase.from("billing_history").insert({
    tenant_id: tenantId,
    invoice_number: `INV-${Date.now()}`,
    amount: isTrialing ? 0 : regularPrice,
    original_amount: regularPrice,
    currency: "USD",
    status: "paid",
    description: isTrialing
      ? `${PLAN_NAMES[planType] || planType} Plan - 7-Day Free Trial Started`
      : `${PLAN_NAMES[planType] || planType} Plan - ${billingInterval === "yearly" ? "Annual" : "Monthly"} Subscription`,
    paid_at: new Date().toISOString(),
  });

  if (historyError) {
    console.error("Error creating billing history:", historyError);
  }

  console.log(`Subscription activated for tenant ${tenantId}: ${planType} (${billingInterval})${isTrialing ? " - Trial" : ""}`);
}

async function handleSubscriptionUpdated(subscriptionEvent: Stripe.Subscription, supabase: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = subscriptionEvent as any;
  const tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.error("Missing tenant_id in subscription metadata");
    return;
  }

  // Map Stripe status to our status
  let status: string;
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    default:
      status = subscription.status;
  }

  // Get period timestamps safely
  const isTrialing = subscription.status === "trialing";
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();

  // For trial subscriptions, use trial_end as next billing date
  let periodEnd: string;
  if (isTrialing && subscription.trial_end) {
    periodEnd = new Date(subscription.trial_end * 1000).toISOString();
  } else if (subscription.current_period_end) {
    periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  } else {
    periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      is_trial: isTrialing,
      trial_ends_at: isTrialing && subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionCanceled(subscriptionEvent: Stripe.Subscription, supabase: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = subscriptionEvent as any;
  const tenantId = subscription.metadata?.tenant_id;

  if (!tenantId) {
    console.error("Missing tenant_id in subscription metadata");
    return;
  }

  // Downgrade to free plan
  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      plan_type: "free",
      status: "active",
      stripe_subscription_id: null,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error canceling subscription:", error);
  }

  console.log(`Subscription canceled for tenant ${tenantId}, downgraded to free plan`);
}

async function handleInvoicePaid(invoiceEvent: Stripe.Invoice, stripe: Stripe, supabase: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = invoiceEvent as any;

  const subscriptionResponse = invoice.subscription
    ? await stripe.subscriptions.retrieve(invoice.subscription as string)
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData = subscriptionResponse as any;

  const tenantId = subscriptionData?.metadata?.tenant_id;
  const planType = subscriptionData?.metadata?.plan_type || "unknown";

  if (!tenantId) {
    console.error("Missing tenant_id in subscription metadata");
    return;
  }

  // Determine billing interval from subscription
  const billingInterval = subscriptionData?.items?.data?.[0]?.price?.recurring?.interval === "year"
    ? "yearly"
    : "monthly";

  const amount = (invoice.amount_paid || 0) / 100;
  const originalAmount = PLAN_PRICES[planType]?.[billingInterval as "monthly" | "yearly"] || amount;

  // Create billing history record
  const { error } = await supabase.from("billing_history").insert({
    tenant_id: tenantId,
    invoice_number: invoice.number || `INV-${Date.now()}`,
    stripe_invoice_id: invoice.id,
    amount: amount,
    original_amount: originalAmount,
    currency: (invoice.currency || "usd").toUpperCase(),
    status: "paid",
    description: `${PLAN_NAMES[planType] || planType} Plan - ${billingInterval === "yearly" ? "Annual" : "Monthly"} Subscription`,
    paid_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating billing history:", error);
  }
}

async function handlePaymentFailed(invoiceEvent: Stripe.Invoice, stripe: Stripe, supabase: SupabaseClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = invoiceEvent as any;

  const subscriptionResponse = invoice.subscription
    ? await stripe.subscriptions.retrieve(invoice.subscription as string)
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData = subscriptionResponse as any;

  const tenantId = subscriptionData?.metadata?.tenant_id;

  if (!tenantId) {
    console.error("Missing tenant_id in subscription metadata");
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error updating subscription status:", error);
  }

  console.log(`Payment failed for tenant ${tenantId}`);
}
