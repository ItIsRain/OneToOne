"use client";

import React from "react";
import Link from "next/link";
import { usePlanLimits, type PlanType } from "@/hooks/usePlanLimits";
import { useSidebar } from "@/context/SidebarContext";

const PLAN_CONFIG: Record<
  PlanType,
  { label: string; color: string; dotColor: string; showUpgrade: boolean }
> = {
  free: {
    label: "Free Plan",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-400",
    showUpgrade: true,
  },
  starter: {
    label: "Starter Plan",
    color: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
    dotColor: "bg-brand-500",
    showUpgrade: true,
  },
  professional: {
    label: "Pro Plan",
    color: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    dotColor: "bg-purple-500",
    showUpgrade: true,
  },
  business: {
    label: "Business Plan",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
    showUpgrade: false,
  },
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  if (limit === -1) return null; // Unlimited, don't show

  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor =
    percent > 95
      ? "bg-error-500"
      : percent > 80
      ? "bg-warning-500"
      : "bg-brand-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function SidebarWidget() {
  const { planInfo, usage, loading } = usePlanLimits();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  if (loading || !planInfo) return null;

  const config = PLAN_CONFIG[planInfo.planType];
  const showExpanded = isExpanded || isHovered || isMobileOpen;

  // Collapsed sidebar: show only a small colored dot
  if (!showExpanded) {
    return (
      <div className="flex justify-center pb-6 pt-2">
        <span className={`h-2.5 w-2.5 rounded-full ${config.dotColor}`} />
      </div>
    );
  }

  const isBusiness = planInfo.planType === "business";

  return (
    <div className="mx-3 mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm dark:border-gray-800/60 dark:bg-white/[0.03]">
      {/* Plan badge */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
        >
          {config.label}
          {isBusiness && (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </div>

      {/* Usage bars (not shown for business) */}
      {!isBusiness && usage && (
        <div className="mb-3 space-y-2.5">
          <UsageBar
            label="Events"
            used={typeof usage.events === "object" ? (usage.events as unknown as { used: number }).used : usage.events}
            limit={planInfo.limits.events as number}
          />
          <UsageBar
            label="Team"
            used={typeof usage.team_members === "object" ? (usage.team_members as unknown as { used: number }).used : usage.team_members}
            limit={planInfo.limits.team_members as number}
          />
        </div>
      )}

      {/* Upgrade CTA */}
      {config.showUpgrade && (
        <Link
          href="/dashboard/settings?tab=billing"
          className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-600 shadow-sm shadow-brand-500/20"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
