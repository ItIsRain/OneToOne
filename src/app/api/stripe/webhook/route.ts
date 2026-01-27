import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create admin supabase client for webhook (no user auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

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
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenant_id;
  const planType = session.metadata?.plan_type;
  const billingInterval = session.metadata?.billing_interval as "monthly" | "yearly";

  if (!tenantId || !planType) {
    console.error("Missing tenant_id or plan_type in session metadata");
    return;
  }

  // Get subscription details from Stripe
  const subscriptionId = session.subscription as string;
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

async function handleSubscriptionUpdated(subscriptionEvent: Stripe.Subscription) {
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
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("tenant_subscriptions")
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionCanceled(subscriptionEvent: Stripe.Subscription) {
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

async function handleInvoicePaid(invoiceEvent: Stripe.Invoice) {
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

async function handlePaymentFailed(invoiceEvent: Stripe.Invoice) {
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
