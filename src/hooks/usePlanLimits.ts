"use client";

import { useState, useEffect, useCallback } from "react";

// Client-side plan limits configuration (mirrors server-side)
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
      workflows: false, // workflow automation requires Professional+
      forms: false, // form builder requires Starter+
      proposals: false, // proposals requires Starter+
      client_portal: false, // client portal requires Professional+
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
      workflows: false, // workflow automation requires Professional+
      forms: true, // form builder enabled
      proposals: true, // proposals enabled
      client_portal: false, // client portal requires Professional+
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
      workflows: true, // workflow automation enabled
      forms: true, // form builder enabled
      proposals: true, // proposals enabled
      client_portal: true, // client portal enabled
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
      workflows: true, // workflow automation enabled
      forms: true, // form builder enabled
      proposals: true, // proposals enabled
      client_portal: true, // client portal enabled
    },
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type FeatureKey = keyof typeof PLAN_LIMITS.free.features;
export type PlanLimits = typeof PLAN_LIMITS[PlanType];

interface PlanInfo {
  planType: PlanType;
  limits: PlanLimits;
}

interface UsageStats {
  events: number;
  team_members: number;
  storage_used_gb: number;
  api_calls_used: number;
}

export function usePlanLimits() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/billing");
      if (!res.ok) {
        throw new Error("Failed to fetch plan info");
      }
      const data = await res.json();
      const planType = (data.subscription?.plan_type || "free") as PlanType;

      setPlanInfo({
        planType,
        limits: PLAN_LIMITS[planType],
      });

      // Set usage from billing stats if available
      if (data.usage) {
        setUsage(data.usage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanInfo();
  }, [fetchPlanInfo]);

  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      if (!planInfo) return false;
      return planInfo.limits.features[feature];
    },
    [planInfo]
  );

  const canCreate = useCallback(
    (resource: "events" | "team_members" | "document_templates", current: number): boolean => {
      if (!planInfo) return false;
      const limit = planInfo.limits[resource];
      return limit === -1 || current < limit;
    },
    [planInfo]
  );

  const getLimit = useCallback(
    (resource: keyof typeof PLAN_LIMITS.free): number => {
      if (!planInfo) return 0;
      const value = planInfo.limits[resource];
      return typeof value === "number" ? value : 0;
    },
    [planInfo]
  );

  const isUnlimited = useCallback(
    (resource: "events" | "team_members" | "attendees_per_event" | "api_calls" | "document_templates"): boolean => {
      if (!planInfo) return false;
      return planInfo.limits[resource] === -1;
    },
    [planInfo]
  );

  const getFeatureRequiredPlan = useCallback((feature: FeatureKey): PlanType | null => {
    const plans: PlanType[] = ["free", "starter", "professional", "business"];
    for (const plan of plans) {
      if (PLAN_LIMITS[plan].features[feature]) {
        return plan;
      }
    }
    return null;
  }, []);

  return {
    planInfo,
    usage,
    loading,
    error,
    hasFeature,
    canCreate,
    getLimit,
    isUnlimited,
    getFeatureRequiredPlan,
    refresh: fetchPlanInfo,
  };
}
