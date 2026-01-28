"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type UseCase = "events" | "clients" | "invoicing" | "projects" | "other";

interface OnboardingStatus {
  hasEvents: boolean;
  hasClients: boolean;
  hasTeamMembers: boolean;
  hasProjects: boolean;
  hasInvoices: boolean;
  hasBranding: boolean;
}

interface ChecklistItem {
  key: string;
  label: string;
  href: string;
  statusKey: keyof OnboardingStatus;
}

const USE_CASE_CHECKLISTS: Record<UseCase, ChecklistItem[]> = {
  events: [
    { key: "event", label: "Create your first event", href: "/dashboard/events", statusKey: "hasEvents" },
    { key: "client", label: "Add a client", href: "/dashboard/crm/clients", statusKey: "hasClients" },
    { key: "team", label: "Invite a team member", href: "/dashboard/team", statusKey: "hasTeamMembers" },
    { key: "branding", label: "Add your logo", href: "/dashboard/settings", statusKey: "hasBranding" },
  ],
  clients: [
    { key: "client", label: "Add your first client", href: "/dashboard/crm/clients", statusKey: "hasClients" },
    { key: "project", label: "Create a project", href: "/dashboard/projects", statusKey: "hasProjects" },
    { key: "team", label: "Invite a team member", href: "/dashboard/team", statusKey: "hasTeamMembers" },
    { key: "branding", label: "Add your logo", href: "/dashboard/settings", statusKey: "hasBranding" },
  ],
  invoicing: [
    { key: "client", label: "Add a client", href: "/dashboard/crm/clients", statusKey: "hasClients" },
    { key: "invoice", label: "Create an invoice", href: "/dashboard/finance/invoices", statusKey: "hasInvoices" },
    { key: "team", label: "Invite a team member", href: "/dashboard/team", statusKey: "hasTeamMembers" },
    { key: "branding", label: "Add your logo", href: "/dashboard/settings", statusKey: "hasBranding" },
  ],
  projects: [
    { key: "project", label: "Create a project", href: "/dashboard/projects", statusKey: "hasProjects" },
    { key: "client", label: "Add a client", href: "/dashboard/crm/clients", statusKey: "hasClients" },
    { key: "team", label: "Invite a team member", href: "/dashboard/team", statusKey: "hasTeamMembers" },
    { key: "branding", label: "Add your logo", href: "/dashboard/settings", statusKey: "hasBranding" },
  ],
  other: [
    { key: "event", label: "Create your first event", href: "/dashboard/events", statusKey: "hasEvents" },
    { key: "client", label: "Add a client", href: "/dashboard/crm/clients", statusKey: "hasClients" },
    { key: "team", label: "Invite a team member", href: "/dashboard/team", statusKey: "hasTeamMembers" },
    { key: "branding", label: "Add your logo", href: "/dashboard/settings", statusKey: "hasBranding" },
  ],
};

export function DashboardOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [useCase, setUseCase] = useState<UseCase>("other");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("onboarding_dismissed") === "true") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [statusRes, tenantRes] = await Promise.all([
          fetch("/api/dashboard/onboarding-status"),
          fetch("/api/tenant/info"),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStatus(statusData);
        }

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          const uc = tenantData.use_case as UseCase;
          setUseCase(USE_CASE_CHECKLISTS[uc] ? uc : "other");
        }
      } catch {
        // Silently fail - onboarding is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("onboarding_dismissed", "true");
  };

  if (dismissed || loading || !status) return null;

  const checklist = USE_CASE_CHECKLISTS[useCase];
  const completedCount = checklist.filter((item) => status[item.statusKey]).length;
  const totalCount = checklist.length;

  // Auto-hide when all complete
  if (completedCount === totalCount) return null;

  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Get started
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {completedCount} of {totalCount} complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Dismiss onboarding"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map((item) => {
          const isComplete = status[item.statusKey];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isComplete
                  ? "bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
              }`}
            >
              {/* Checkbox */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isComplete
                    ? "border-brand-500 bg-brand-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {isComplete && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              <span className={isComplete ? "line-through" : ""}>
                {item.label}
              </span>

              {!isComplete && (
                <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
