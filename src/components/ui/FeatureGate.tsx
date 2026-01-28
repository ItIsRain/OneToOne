"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePlanLimits, FeatureKey, PLAN_LIMITS, PlanType } from "@/hooks/usePlanLimits";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FEATURE_INFO: Record<FeatureKey, { title: string; description: string; icon: string }> = {
  crm: {
    title: "CRM & Client Management",
    description: "Manage your clients, contacts, and leads all in one place. Track interactions, set follow-ups, and grow your business relationships.",
    icon: "users",
  },
  custom_branding: {
    title: "Custom Branding",
    description: "Customize your event pages and communications with your own logo, colors, and branding to create a professional experience.",
    icon: "palette",
  },
  judging_system: {
    title: "Judging System",
    description: "Set up judges, define scoring criteria, and manage the entire judging process for competitions and hackathons.",
    icon: "award",
  },
  advanced_analytics: {
    title: "Advanced Analytics",
    description: "Get deeper insights into your events with detailed analytics, custom reports, and performance tracking.",
    icon: "chart",
  },
  invoicing: {
    title: "Invoicing & Billing",
    description: "Create professional invoices, track payments, and manage your billing workflow seamlessly.",
    icon: "receipt",
  },
  time_tracking: {
    title: "Time Tracking",
    description: "Track time spent on projects and tasks, manage team hours, and generate timesheets for billing.",
    icon: "clock",
  },
  api_keys: {
    title: "API Access",
    description: "Generate API keys to integrate with external systems, automate workflows, and build custom integrations.",
    icon: "code",
  },
  white_label: {
    title: "White Label",
    description: "Remove all OneToOne branding and fully customize the platform with your own brand identity.",
    icon: "building",
  },
  sso: {
    title: "Single Sign-On (SSO)",
    description: "Enable enterprise SSO/SAML authentication for seamless and secure team access.",
    icon: "shield",
  },
  document_templates: {
    title: "Document Templates",
    description: "Create and manage reusable document templates for contracts, proposals, and more. Save time by automating your paperwork.",
    icon: "document",
  },
  email_provider: {
    title: "Custom Email Provider",
    description: "Configure your own email provider (SMTP, SendGrid, Resend, etc.) to send emails from your domain with full control over deliverability.",
    icon: "email",
  },
  finance: {
    title: "Finance Management",
    description: "Manage your finances with budgets, expenses, payments, and invoicing. Track financial health and generate reports.",
    icon: "finance",
  },
  projects: {
    title: "Project Management",
    description: "Organize work with projects and tasks. Track progress and collaborate with your team.",
    icon: "projects",
  },
  kanban: {
    title: "Kanban Board",
    description: "Visualize and manage your workflow with drag-and-drop kanban boards. Move tasks between columns and track progress at a glance.",
    icon: "kanban",
  },
  timeline: {
    title: "Timeline View",
    description: "Plan and track projects with a Gantt-style timeline view. See task dependencies, milestones, and deadlines across time.",
    icon: "timeline",
  },
  expenses: {
    title: "Expense Tracking",
    description: "Track and categorize all business expenses. Monitor spending, upload receipts, and generate expense reports.",
    icon: "expense",
  },
  payments: {
    title: "Payment Tracking",
    description: "Record and monitor all incoming payments. Track payment methods, reconcile with invoices, and maintain cash flow visibility.",
    icon: "payment",
  },
  budgets: {
    title: "Budget Management",
    description: "Create and manage budgets for projects and departments. Set spending limits, track actual vs. planned, and forecast future costs.",
    icon: "budget",
  },
  workflows: {
    title: "Workflow Automation",
    description: "Automate repetitive agency tasks with triggers, approval gates, and multi-step pipelines.",
    icon: "automation",
  },
};

const PLAN_NAMES: Record<PlanType, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
};

const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  starter: 29,
  professional: 79,
  business: 199,
};

function getRequiredPlan(feature: FeatureKey): PlanType | null {
  const plans: PlanType[] = ["free", "starter", "professional", "business"];
  for (const plan of plans) {
    if (PLAN_LIMITS[plan].features[feature]) {
      return plan;
    }
  }
  return null;
}

function FeatureIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "users":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "palette":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case "award":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case "chart":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "receipt":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      );
    case "clock":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "code":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case "building":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "shield":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "document":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "email":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case "finance":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "projects":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case "kanban":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    case "timeline":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "expense":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "payment":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "budget":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      );
    case "automation":
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { planInfo, loading, hasFeature } = usePlanLimits();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing while loading
  if (!mounted || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  // If user has access to the feature, show the content
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade banner
  const info = FEATURE_INFO[feature];
  const requiredPlan = getRequiredPlan(feature);
  const currentPlan = planInfo?.planType || "free";

  return (
    <div className="flex min-h-[500px] items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-lime-500 to-emerald-500 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white">
                <FeatureIcon icon={info.icon} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{info.title}</h2>
                <p className="text-lime-100">Unlock this feature</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {info.description}
            </p>

            {/* Plan comparison */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Your current plan
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {PLAN_NAMES[currentPlan]}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ${PLAN_PRICES[currentPlan]}/month
                  </p>
                </div>

                <div className="text-gray-300 dark:text-gray-600">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {requiredPlan && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-lime-600 dark:text-lime-400">
                      Required plan
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {PLAN_NAMES[requiredPlan]}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${PLAN_PRICES[requiredPlan]}/month
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Features included */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                What you&apos;ll get with {requiredPlan ? PLAN_NAMES[requiredPlan] : "an upgraded plan"}:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="h-5 w-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full access to {info.title}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="h-5 w-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Increased limits on events and team members
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="h-5 w-5 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/settings/billing"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-lime-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Upgrade Now
              </Link>
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                View All Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureGate;
