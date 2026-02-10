import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin(request: Request): Promise<{ authorized: boolean; error?: string; userId?: string }> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return { authorized: false, error: "Unauthorized" };
  }

  const serviceClient = getServiceClient();

  // Get user's email from profiles
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) {
    return { authorized: false, error: "Unauthorized" };
  }

  const { data: adminRecord } = await serviceClient
    .from("platform_admins")
    .select("id")
    .eq("email", profile.email.toLowerCase())
    .maybeSingle();

  if (!adminRecord) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true, userId };
}

export async function GET(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    // Fetch tenants with their subscriptions
    const { data: tenants, error: tenantsError } = await serviceClient
      .from("tenants")
      .select("id, name, subdomain, created_at")
      .order("created_at", { ascending: false });

    if (tenantsError) throw tenantsError;

    // Fetch all subscriptions with trial info
    const { data: subscriptionsData, error: subsError } = await serviceClient
      .from("tenant_subscriptions")
      .select("tenant_id, plan_type, status, current_period_start, current_period_end, created_at, is_trial, trial_ends_at, stripe_subscription_id, granted_by, granted_at, grant_reason");

    if (subsError) throw subsError;

    // Create a map of tenant_id to subscription
    const subscriptionMap = new Map<string, {
      plan_type: string;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
      created_at: string;
      is_trial: boolean;
      trial_ends_at: string | null;
      stripe_subscription_id: string | null;
      granted_by: string | null;
      granted_at: string | null;
      grant_reason: string | null;
    }>();

    (subscriptionsData || []).forEach((sub) => {
      // Keep the most recent subscription for each tenant
      if (!subscriptionMap.has(sub.tenant_id) ||
          new Date(sub.created_at) > new Date(subscriptionMap.get(sub.tenant_id)!.created_at)) {
        subscriptionMap.set(sub.tenant_id, sub);
      }
    });

    // Combine tenants with their subscription data
    const subscriptions = (tenants || []).map((t) => {
      const sub = subscriptionMap.get(t.id);
      const now = new Date();
      const trialEndsAt = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;

      // Determine subscription type
      // Priority: granted > expired trial > active trial > paid > free
      let subscriptionType: "free" | "trial" | "paid" | "expired" | "granted" = "free";
      if (sub) {
        if (sub.granted_by) {
          // Admin granted subscription
          subscriptionType = "granted";
        } else if (trialEndsAt) {
          // Has a trial end date - check if expired or active
          if (trialEndsAt < now) {
            subscriptionType = "expired";
          } else {
            // Trial is still active (even if they have a stripe_subscription_id from trial checkout)
            subscriptionType = "trial";
          }
        } else if (sub.is_trial) {
          // Legacy: is_trial flag without trial_ends_at
          subscriptionType = "trial";
        } else if (sub.stripe_subscription_id) {
          // Has Stripe subscription AND no trial period = actually paid
          subscriptionType = "paid";
        } else if (sub.plan_type !== "free") {
          // Non-free plan without Stripe = trial
          subscriptionType = "trial";
        }
      }

      return {
        id: t.id,
        tenant_id: t.id,
        tenant_name: t.name,
        tenant_subdomain: t.subdomain,
        plan: sub?.plan_type || "free",
        status: sub?.status || "active",
        current_period_start: sub?.current_period_start || null,
        current_period_end: sub?.current_period_end || null,
        created_at: sub?.created_at || t.created_at,
        is_trial: sub?.is_trial || false,
        trial_ends_at: sub?.trial_ends_at || null,
        has_stripe: !!sub?.stripe_subscription_id,
        subscription_type: subscriptionType,
        granted_by: sub?.granted_by || null,
        granted_at: sub?.granted_at || null,
        grant_reason: sub?.grant_reason || null,
      };
    });

    // Calculate plan stats with trial breakdown
    const planStats = { free: 0, starter: 0, professional: 0, business: 0 };
    const trialStats = { trial: 0, paid: 0, granted: 0, expired: 0 };
    let potentialMRR = 0;
    let actualMRR = 0;

    const PLAN_PRICES: Record<string, number> = {
      free: 0,
      starter: 29,
      professional: 79,
      business: 199,
    };

    subscriptions.forEach((sub) => {
      const plan = sub.plan.toLowerCase() as keyof typeof planStats;
      if (plan in planStats) {
        planStats[plan]++;
      } else {
        planStats.free++;
      }

      // Count by subscription type
      if (sub.subscription_type === "trial") {
        trialStats.trial++;
        potentialMRR += PLAN_PRICES[plan] || 0;
      } else if (sub.subscription_type === "paid") {
        trialStats.paid++;
        actualMRR += PLAN_PRICES[plan] || 0;
      } else if (sub.subscription_type === "granted") {
        trialStats.granted++;
      } else if (sub.subscription_type === "expired") {
        trialStats.expired++;
      }
    });

    return NextResponse.json({
      subscriptions,
      planStats,
      trialStats,
      revenue: {
        actualMRR,
        potentialMRR,
        totalMRR: actualMRR + potentialMRR,
      }
    });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { id, plan } = await request.json();

    // Check if subscription exists for this tenant
    const { data: existingSub } = await serviceClient
      .from("tenant_subscriptions")
      .select("id")
      .eq("tenant_id", id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error } = await serviceClient
        .from("tenant_subscriptions")
        .update({
          plan_type: plan,
          updated_at: new Date().toISOString()
        })
        .eq("tenant_id", id);

      if (error) throw error;
    } else {
      // Create new subscription
      const { error } = await serviceClient
        .from("tenant_subscriptions")
        .insert({
          tenant_id: id,
          plan_type: plan,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating subscription:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Grant subscription to tenant
export async function POST(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (!authCheck.authorized || !authCheck.userId) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === "Forbidden" ? 403 : 401 });
  }

  const serviceClient = getServiceClient();

  try {
    const { tenant_id, plan, days, reason } = await request.json();

    if (!tenant_id || !plan || !days) {
      return NextResponse.json({ error: "Missing required fields: tenant_id, plan, days" }, { status: 400 });
    }

    if (days < 1 || days > 365) {
      return NextResponse.json({ error: "Days must be between 1 and 365" }, { status: 400 });
    }

    const validPlans = ["free", "starter", "professional", "business"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Check if subscription exists
    const { data: existingSub } = await serviceClient
      .from("tenant_subscriptions")
      .select("id")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    const subscriptionData = {
      plan_type: plan,
      status: "active",
      is_trial: plan !== "free", // Free plan is not a trial
      trial_ends_at: plan !== "free" ? periodEnd.toISOString() : null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      granted_by: authCheck.userId,
      granted_at: now.toISOString(),
      grant_reason: reason || `Granted ${days} days of ${plan} plan by admin`,
      updated_at: now.toISOString(),
    };

    if (existingSub) {
      const { error } = await serviceClient
        .from("tenant_subscriptions")
        .update(subscriptionData)
        .eq("tenant_id", tenant_id);

      if (error) throw error;
    } else {
      const { error } = await serviceClient
        .from("tenant_subscriptions")
        .insert({
          tenant_id,
          ...subscriptionData,
          created_at: now.toISOString(),
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${days} days of ${plan} plan`,
      expires_at: periodEnd.toISOString(),
    });
  } catch (err) {
    console.error("Error granting subscription:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
