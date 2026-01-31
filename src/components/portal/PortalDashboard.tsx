"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  activeProjects: number;
  pendingApprovals: number;
  outstandingInvoices: number;
  sharedFiles: number;
  recentActivity: {
    id: string;
    type: "approval" | "invoice" | "file";
    title: string;
    date: string;
  }[];
}

interface PortalDashboardProps {
  portalClientId: string;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({
  portalClientId,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/portal/dashboard", {
          headers: { "x-portal-client-id": portalClientId },
        });
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [portalClientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: "Active Projects",
      value: data.activeProjects,
      href: "projects",
      color: "bg-blue-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: "Pending Approvals",
      value: data.pendingApprovals,
      href: "approvals",
      color: "bg-amber-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Outstanding Invoices",
      value: data.outstandingInvoices,
      href: "invoices",
      color: "bg-red-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Shared Files",
      value: data.sharedFiles,
      href: "files",
      color: "bg-purple-500",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const activityTypeLabel = (type: string) => {
    switch (type) {
      case "approval":
        return "Approval";
      case "invoice":
        return "Invoice";
      case "file":
        return "File";
      default:
        return type;
    }
  };

  const activityTypeBadgeColor = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "invoice":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "file":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-white ${card.color}`}
              >
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
              >
                {/* Mobile: stacked layout */}
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${activityTypeBadgeColor(item.type)}`}
                    >
                      {activityTypeLabel(item.type)}
                    </span>
                    <span className="truncate text-sm text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
