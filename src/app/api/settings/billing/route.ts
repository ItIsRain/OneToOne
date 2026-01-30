import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    events: 3,
    team_members: 2,
    storage_gb: 0.5,
    api_calls: 1000,
    attendees_per_event: 50,
    document_templates: 0,
  },
  starter: {
    events: 10,
    team_members: 5,
    storage_gb: 5,
    api_calls: 10000,
    attendees_per_event: 200,
    document_templates: 5,
  },
  professional: {
    events: 50,
    team_members: 15,
    storage_gb: 25,
    api_calls: 50000,
    attendees_per_event: 1000,
    document_templates: 25,
  },
  business: {
    events: -1, // unlimited
    team_members: -1,
    storage_gb: 100,
    api_calls: -1,
    attendees_per_event: -1,
    document_templates: -1,
  },
};

const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 29, yearly: 279 },
  professional: { monthly: 79, yearly: 758 },
  business: { monthly: 199, yearly: 1910 },
};

const PLANS = [
  {
    type: "free",
    name: "Free",
    description: "Perfect for trying out the platform",
    price: PLAN_PRICES.free,
    limits: PLAN_LIMITS.free,
    features: [
      { text: "3 events total", included: true },
      { text: "2 team members", included: true },
      { text: "500 MB storage", included: true },
      { text: "1,000 API calls/month", included: true },
      { text: "Up to 50 attendees per event", included: true },
      { text: "Basic analytics", included: true },
      { text: "Community support", included: true },
      { text: "CRM features", included: false },
      { text: "Custom branding", included: false },
      { text: "Judging system", included: false },
    ],
    badge: null,
  },
  {
    type: "starter",
    name: "Starter",
    description: "For small agencies and freelancers",
    price: PLAN_PRICES.starter,
    limits: PLAN_LIMITS.starter,
    trial_days: 7,
    features: [
      { text: "7-day free trial", included: true, highlight: true },
      { text: "10 events/month", included: true },
      { text: "5 team members", included: true },
      { text: "5 GB storage", included: true },
      { text: "10,000 API calls/month", included: true },
      { text: "Up to 200 attendees per event", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email support", included: true },
      { text: "Basic CRM features", included: true },
      { text: "Basic invoicing", included: true },
      { text: "Logo branding", included: true },
      { text: "Judging system", included: false },
      { text: "Advanced analytics", included: false },
    ],
    badge: null,
  },
  {
    type: "professional",
    name: "Professional",
    description: "For growing agencies and regular organizers",
    price: PLAN_PRICES.professional,
    limits: PLAN_LIMITS.professional,
    trial_days: 7,
    features: [
      { text: "7-day free trial", included: true, highlight: true },
      { text: "50 events/month", included: true },
      { text: "15 team members", included: true },
      { text: "25 GB storage", included: true },
      { text: "50,000 API calls/month", included: true },
      { text: "Up to 1,000 attendees per event", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority email support", included: true },
      { text: "Full CRM features", included: true },
      { text: "Advanced invoicing & payments", included: true },
      { text: "Full custom branding", included: true },
      { text: "Judging system", included: true },
      { text: "Document templates (25)", included: true },
      { text: "Time tracking", included: true },
      { text: "Advanced permissions", included: true },
      { text: "Workflow automation", included: true },
    ],
    badge: "Most Popular",
  },
  {
    type: "business",
    name: "Business",
    description: "For large agencies and enterprise events",
    price: PLAN_PRICES.business,
    limits: PLAN_LIMITS.business,
    trial_days: 7,
    features: [
      { text: "7-day free trial", included: true, highlight: true },
      { text: "Unlimited events", included: true },
      { text: "Unlimited team members", included: true },
      { text: "100 GB storage", included: true },
      { text: "Unlimited API calls", included: true },
      { text: "Unlimited attendees per event", included: true },
      { text: "Advanced analytics", included: true },
      { text: "24/7 priority support + phone", included: true },
      { text: "Full CRM features", included: true },
      { text: "Advanced invoicing & payments", included: true },
      { text: "White-label branding", included: true },
      { text: "Judging system", included: true },
      { text: "Unlimited document templates", included: true },
      { text: "Time tracking", included: true },
      { text: "Custom roles & permissions", included: true },
      { text: "SSO/SAML integration", included: true },
      { text: "Audit logs", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "99.9% SLA guarantee", included: true },
      { text: "Workflow automation", included: true },
    ],
    badge: "Enterprise",
  },
];

// GET - Get billing information
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

    const tenantId = profile.tenant_id;

    // Get tenant's subdomain for redirect purposes
    const { data: tenant } = await supabase
      .from("tenants")
      .select("subdomain")
      .eq("id", tenantId)
      .single();

    // Get or create subscription
    let { data: subscription } = await supabase
      .from("tenant_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    // If no subscription exists, create a free one
    if (!subscription) {
      const { data: newSub, error: createError } = await supabase
        .from("tenant_subscriptions")
        .insert({
          tenant_id: tenantId,
          plan_type: "free",
          status: "active",
          billing_interval: "monthly",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating subscription:", createError);
      } else {
        subscription = newSub;
      }
    }

    // Get payment methods
    const { data: paymentMethods } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    // Get usage stats and check if user has used trial before
    const [eventsResult, membersResult, templatesResult, billingHistoryResult] = await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("document_templates")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("billing_history")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
    ]);

    // User has used trial if they have any billing history or have a stripe subscription
    const hasUsedTrial = (billingHistoryResult.count || 0) > 0 || !!subscription?.stripe_subscription_id;

    const planType = (subscription?.plan_type || "free") as keyof typeof PLAN_LIMITS;
    const billingInterval = (subscription?.billing_interval || "monthly") as "monthly" | "yearly";
    const limits = PLAN_LIMITS[planType];
    const prices = PLAN_PRICES[planType];

    const usage = {
      events: {
        used: eventsResult.count || 0,
        limit: limits.events,
        percentage: limits.events === -1 ? 0 : Math.round(((eventsResult.count || 0) / limits.events) * 100),
      },
      team_members: {
        used: membersResult.count || 0,
        limit: limits.team_members,
        percentage: limits.team_members === -1 ? 0 : Math.round(((membersResult.count || 0) / limits.team_members) * 100),
      },
      storage: {
        used: 0.2, // Placeholder - would need actual file size calculation
        limit: limits.storage_gb,
        percentage: Math.round((0.2 / limits.storage_gb) * 100),
      },
      api_calls: {
        used: 0, // Placeholder - would need API call tracking
        limit: limits.api_calls,
        percentage: 0,
      },
      document_templates: {
        used: templatesResult.count || 0,
        limit: limits.document_templates,
        percentage: limits.document_templates === -1 || limits.document_templates === 0
          ? 0
          : Math.round(((templatesResult.count || 0) / limits.document_templates) * 100),
      },
    };

    const price = prices[billingInterval];

    // Fetch live data from Stripe subscription
    let isTrialing = false;
    let nextBillingDate: string | null = null;
    let stripeCancelAtPeriodEnd = false;
    if (subscription?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-12-15.clover",
        });
        const stripeSub = await stripeClient.subscriptions.retrieve(subscription.stripe_subscription_id);
        isTrialing = stripeSub.status === "trialing";
        stripeCancelAtPeriodEnd = stripeSub.cancel_at_period_end;

        // Use trial_end for trialing subs, current_period_end otherwise
        if (isTrialing && stripeSub.trial_end) {
          nextBillingDate = new Date(stripeSub.trial_end * 1000).toISOString();
        } else if ((stripeSub as unknown as Record<string, unknown>).current_period_end) {
          nextBillingDate = new Date(((stripeSub as unknown as Record<string, unknown>).current_period_end as number) * 1000).toISOString();
        }

        // Sync local DB with Stripe truth
        const syncData: Record<string, unknown> = {};
        if (nextBillingDate && subscription.current_period_end !== nextBillingDate) {
          syncData.current_period_end = nextBillingDate;
        }
        if (subscription.cancel_at_period_end !== stripeCancelAtPeriodEnd) {
          syncData.cancel_at_period_end = stripeCancelAtPeriodEnd;
        }
        if (Object.keys(syncData).length > 0) {
          await supabase
            .from("tenant_subscriptions")
            .update(syncData)
            .eq("id", subscription.id);
          if (syncData.current_period_end) subscription.current_period_end = nextBillingDate!;
          if (syncData.cancel_at_period_end !== undefined) subscription.cancel_at_period_end = stripeCancelAtPeriodEnd;
        }
      } catch (e) {
        console.error("Error fetching Stripe subscription status:", e);
      }
    }

    return NextResponse.json({
      subscription: {
        ...subscription,
        price,
        billing_interval: billingInterval,
        is_trialing: isTrialing,
        next_billing_date: nextBillingDate || subscription?.current_period_end || null,
      },
      paymentMethods: paymentMethods || [],
      usage,
      plans: PLANS,
      hasUsedTrial,
      subdomain: tenant?.subdomain || null,
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update subscription (upgrade/downgrade)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const body = await request.json();
    const { plan_type, billing_interval, cancel_at_period_end } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (plan_type && ["free", "starter", "professional", "business"].includes(plan_type)) {
      updateData.plan_type = plan_type;
      // Reset period for new subscription
      const periodDays = billing_interval === "yearly" ? 365 : 30;
      updateData.current_period_start = new Date().toISOString();
      updateData.current_period_end = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();
      updateData.status = "active";
      updateData.cancel_at_period_end = false;
    }

    if (billing_interval && ["monthly", "yearly"].includes(billing_interval)) {
      updateData.billing_interval = billing_interval;
    }

    if (typeof cancel_at_period_end === "boolean") {
      updateData.cancel_at_period_end = cancel_at_period_end;
    }

    const { data: subscription, error } = await supabase
      .from("tenant_subscriptions")
      .update(updateData)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }

    const planName = PLANS.find(p => p.type === subscription.plan_type)?.name || subscription.plan_type;

    return NextResponse.json({
      success: true,
      subscription,
      message: plan_type ? `Successfully switched to ${planName} plan` : "Subscription updated",
    });
  } catch (error) {
    console.error("Error updating billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
