"use client";

import { useState, useEffect, useCallback } from "react";

// Client-side plan limits configuration (mirrors server-side)
export const PLAN_LIMITS = {
  free: {
    events: 3,
    team_members: 2,
    storage_gb: 0.5,
    api_calls: 1000,
    attendees_per_event: 50,
    document_templates: 0,
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
      crm: true,
      custom_branding: true,
      judging_system: false,
      advanced_analytics: false,
      invoicing: true,
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
    events: -1,
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
