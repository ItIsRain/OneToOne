"use client";

import Link from "next/link";

interface UpgradePromptProps {
  title?: string;
  message: string;
  currentPlan?: string;
  feature?: string;
  showButton?: boolean;
  className?: string;
}

export function UpgradePrompt({
  title = "Upgrade Required",
  message,
  currentPlan,
  feature,
  showButton = true,
  className = "",
}: UpgradePromptProps) {
  return (
    <div
      className={`rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800/30 dark:bg-yellow-900/10 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-800/30">
          <svg
            className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            {title}
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {message}
          </p>
          {currentPlan && (
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Current plan: <span className="font-medium capitalize">{currentPlan}</span>
            </p>
          )}
          {feature && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              Feature: <span className="font-medium">{feature.replace(/_/g, " ")}</span>
            </p>
          )}
          {showButton && (
            <Link
              href="/dashboard/settings/billing"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

interface PlanLimitBarProps {
  current: number;
  limit: number;
  label: string;
  showUpgradeLink?: boolean;
}

export function PlanLimitBar({
  current,
  limit,
  label,
  showUpgradeLink = true,
}: PlanLimitBarProps) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={`font-medium ${
            isAtLimit
              ? "text-red-600 dark:text-red-400"
              : isNearLimit
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-800 dark:text-white"
          }`}
        >
          {current} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
              ? "bg-yellow-500"
              : "bg-lime-500"
          }`}
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
      {isAtLimit && showUpgradeLink && (
        <Link
          href="/dashboard/settings/billing"
          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Upgrade to add more &rarr;
        </Link>
      )}
    </div>
  );
}
