import { SupabaseClient } from "@supabase/supabase-js";

// Plan limits configuration
// Free: 3 events, 2 team, 500MB, 1k API, 50 attendees, basic analytics, API enabled
// Starter ($29): 10 events, 5 team, 5GB, 10k API, 200 attendees, CRM
// Professional ($79): 50 events, 15 team, 25GB, 50k API, 1000 attendees, advanced analytics
// Business ($199): Unlimited everything, white label, SSO
export const PLAN_LIMITS = {
  free: {
    events: 3,
    team_members: 2,
    storage_gb: 0.5, // 500 MB
    api_calls: 1000,
    attendees_per_event: 50,
    document_templates: 0,
    // Feature flags - Free plan includes: basic analytics, API access
    features: {
      crm: false, // CRM requires paid plan
      custom_branding: false,
      judging_system: false,
      advanced_analytics: false, // basic analytics only (dashboard)
      invoicing: false,
      time_tracking: false,
      api_keys: true, // API enabled with 1000 calls/month
      white_label: false,
      sso: false,
      document_templates: false,
      email_provider: false, // custom email provider requires Professional+
      finance: false, // finance features require paid plan
      projects: false, // projects features require paid plan
      kanban: false, // kanban board requires Professional+
      timeline: false, // timeline view requires Professional+
      expenses: false, // expense tracking requires Starter+
      payments: false, // payment tracking requires Professional+
      budgets: false, // budget management requires Business
    },
  },
  starter: {
    events: 10,
    team_members: 5,
    storage_gb: 5,
    api_calls: 10000,
    attendees_per_event: 200,
    document_templates: 5,
    features: {
      crm: true, // basic CRM
      custom_branding: true, // logo only
      judging_system: false,
      advanced_analytics: false, // basic analytics only
      invoicing: true, // basic invoicing
      time_tracking: false,
      api_keys: true, // API enabled with 10,000 calls/month
      white_label: false,
      sso: false,
      document_templates: true,
      email_provider: false, // custom email provider requires Professional+
      finance: true, // finance overview enabled
      projects: true, // projects list & tasks enabled
      kanban: false, // kanban board requires Professional+
      timeline: false, // timeline view requires Professional+
      expenses: true, // expense tracking enabled
      payments: false, // payment tracking requires Professional+
      budgets: false, // budget management requires Business
    },
  },
  professional: {
    events: 50,
    team_members: 15,
    storage_gb: 25,
    api_calls: 50000,
    attendees_per_event: 1000,
    document_templates: 25,
    // +6 features vs Starter: advanced analytics, judging system, time tracking, full CRM, email provider, kanban, timeline, payments
    features: {
      crm: true, // full CRM features
      custom_branding: true, // full branding
      judging_system: true, // judging/scoring system
      advanced_analytics: true, // advanced analytics & reports
      invoicing: true, // full invoicing
      time_tracking: true, // time tracking for team
      api_keys: true, // API enabled with 50k calls/month
      white_label: false, // Business only
      sso: false, // Business only
      document_templates: true, // up to 25 templates
      email_provider: true, // custom email provider (SMTP, SendGrid, etc.)
      finance: true, // finance overview enabled
      projects: true, // projects list & tasks enabled
      kanban: true, // kanban board enabled
      timeline: true, // timeline/gantt view enabled
      expenses: true, // expense tracking enabled
      payments: true, // payment tracking enabled
      budgets: false, // budget management requires Business
    },
  },
  business: {
    events: -1, // unlimited
    team_members: -1, // unlimited
    storage_gb: 100, // 100 GB storage
    api_calls: -1, // unlimited
    attendees_per_event: -1, // unlimited
    document_templates: -1, // unlimited
    // All features unlocked including white label, SSO & budgets
    features: {
      crm: true, // full CRM features
      custom_branding: true, // full branding
      judging_system: true, // judging/scoring system
      advanced_analytics: true, // advanced analytics & reports
      invoicing: true, // full invoicing
      time_tracking: true, // time tracking for team
      api_keys: true, // unlimited API calls
      white_label: true, // white label / custom domain
      sso: true, // single sign-on
      document_templates: true, // unlimited templates
      email_provider: true, // custom email provider (SMTP, SendGrid, etc.)
      finance: true, // finance overview enabled
      projects: true, // all project features enabled
      kanban: true, // kanban board enabled
      timeline: true, // timeline/gantt view enabled
      expenses: true, // expense tracking enabled
      payments: true, // payment tracking enabled
      budgets: true, // budget management (Business exclusive)
    },
  },
};

export type PlanType = keyof typeof PLAN_LIMITS;
export type FeatureKey = keyof typeof PLAN_LIMITS.free.features;

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
  upgrade_required?: boolean;
}

export interface TenantSubscription {
  plan_type: PlanType;
  status: string;
}

/**
 * Get the current subscription for a tenant
 */
export async function getTenantSubscription(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantSubscription | null> {
  const { data: subscription } = await supabase
    .from("tenant_subscriptions")
    .select("plan_type, status")
    .eq("tenant_id", tenantId)
    .single();

  return subscription as TenantSubscription | null;
}

/**
 * Check if a feature is available for the given plan
 */
export function checkFeatureAccess(
  planType: PlanType,
  feature: FeatureKey
): PlanCheckResult {
  const limits = PLAN_LIMITS[planType];
  const hasAccess = limits.features[feature];

  if (!hasAccess) {
    return {
      allowed: false,
      reason: `The ${feature.replace(/_/g, " ")} feature requires a higher plan`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if the tenant can create more events
 */
export async function checkEventLimit(
  supabase: SupabaseClient,
  tenantId: string,
  planType: PlanType
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planType];

  // Unlimited events
  if (limits.events === -1) {
    return { allowed: true };
  }

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const currentCount = count || 0;

  if (currentCount >= limits.events) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.events} events on your ${planType} plan`,
      current: currentCount,
      limit: limits.events,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.events,
  };
}

/**
 * Check if the tenant can add more team members
 */
export async function checkTeamMemberLimit(
  supabase: SupabaseClient,
  tenantId: string,
  planType: PlanType
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planType];

  // Unlimited team members
  if (limits.team_members === -1) {
    return { allowed: true };
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const currentCount = count || 0;

  if (currentCount >= limits.team_members) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.team_members} team members on your ${planType} plan`,
      current: currentCount,
      limit: limits.team_members,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.team_members,
  };
}

/**
 * Check if the tenant can add more attendees to an event
 */
export async function checkAttendeeLimit(
  supabase: SupabaseClient,
  eventId: string,
  planType: PlanType
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planType];

  // Unlimited attendees
  if (limits.attendees_per_event === -1) {
    return { allowed: true };
  }

  const { count } = await supabase
    .from("event_attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const currentCount = count || 0;

  if (currentCount >= limits.attendees_per_event) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.attendees_per_event} attendees per event on your ${planType} plan`,
      current: currentCount,
      limit: limits.attendees_per_event,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.attendees_per_event,
  };
}

/**
 * Check if the tenant can create more document templates
 */
export async function checkDocumentTemplateLimit(
  supabase: SupabaseClient,
  tenantId: string,
  planType: PlanType
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planType];

  // Unlimited templates
  if (limits.document_templates === -1) {
    return { allowed: true };
  }

  // No templates allowed on free plan
  if (limits.document_templates === 0) {
    return {
      allowed: false,
      reason: "Document templates are not available on your current plan",
      current: 0,
      limit: 0,
      upgrade_required: true,
    };
  }

  const { count } = await supabase
    .from("document_templates")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const currentCount = count || 0;

  if (currentCount >= limits.document_templates) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.document_templates} document templates on your ${planType} plan`,
      current: currentCount,
      limit: limits.document_templates,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.document_templates,
  };
}

/**
 * Get plan limits for a given plan type
 */
export function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

/**
 * Helper to get user's tenant and subscription
 * Returns "free" plan as default if no subscription exists
 */
export async function getUserPlanInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tenantId: string; planType: PlanType; subscription: TenantSubscription } | null> {
  // Get user's profile to find tenant_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();

  if (!profile?.tenant_id) {
    return null;
  }

  const subscription = await getTenantSubscription(supabase, profile.tenant_id);

  // Default to free plan if no subscription exists
  if (!subscription) {
    return {
      tenantId: profile.tenant_id,
      planType: "free",
      subscription: { plan_type: "free", status: "active" },
    };
  }

  // If subscription exists but is not active, still default to free
  if (subscription.status !== "active") {
    return {
      tenantId: profile.tenant_id,
      planType: "free",
      subscription: { plan_type: "free", status: "active" },
    };
  }

  return {
    tenantId: profile.tenant_id,
    planType: subscription.plan_type,
    subscription,
  };
}
