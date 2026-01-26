import { SupabaseClient } from "@supabase/supabase-js";

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    events: 3,
    team_members: 2,
    storage_gb: 0.5,
    api_calls: 1000,
    attendees_per_event: 50,
    document_templates: 0,
    // Feature flags
    features: {
      crm: false,
      custom_branding: false,
      judging_system: false,
      advanced_analytics: false,
      invoicing: false,
      time_tracking: false,
      api_keys: false,
      white_label: false,
      sso: false,
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
      crm: true, // basic
      custom_branding: true, // logo only
      judging_system: false,
      advanced_analytics: false,
      invoicing: true, // basic
      time_tracking: false,
      api_keys: false,
      white_label: false,
      sso: false,
    },
  },
  professional: {
    events: 50,
    team_members: 15,
    storage_gb: 25,
    api_calls: 50000,
    attendees_per_event: 1000,
    document_templates: 25,
    features: {
      crm: true,
      custom_branding: true,
      judging_system: true,
      advanced_analytics: true,
      invoicing: true,
      time_tracking: true,
      api_keys: true,
      white_label: false,
      sso: false,
    },
  },
  business: {
    events: -1, // unlimited
    team_members: -1,
    storage_gb: 100,
    api_calls: -1,
    attendees_per_event: -1,
    document_templates: -1,
    features: {
      crm: true,
      custom_branding: true,
      judging_system: true,
      advanced_analytics: true,
      invoicing: true,
      time_tracking: true,
      api_keys: true,
      white_label: true,
      sso: true,
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

  if (!subscription || subscription.status !== "active") {
    return null;
  }

  return {
    tenantId: profile.tenant_id,
    planType: subscription.plan_type,
    subscription,
  };
}
