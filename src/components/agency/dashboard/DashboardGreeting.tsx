"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SummaryData {
  firstName: string;
  overdueTasks: number;
  todayEvents: number;
  unpaidInvoices: number;
  unreadMessages: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface AttentionItem {
  count: number;
  label: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}

export function DashboardGreeting() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = getGreeting();
  const dateStr = formatDate();

  if (loading) {
    return (
      <div>
        <div className="mb-1 h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const name = data?.firstName || "";

  const items: AttentionItem[] = [];
  if (data) {
    if (data.overdueTasks > 0) {
      items.push({
        count: data.overdueTasks,
        label: data.overdueTasks === 1 ? "overdue task" : "overdue tasks",
        href: "/dashboard/projects/tasks",
        color: "text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      });
    }
    if (data.todayEvents > 0) {
      items.push({
        count: data.todayEvents,
        label: data.todayEvents === 1 ? "event today" : "events today",
        href: "/dashboard/events",
        color: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        ),
      });
    }
    if (data.unpaidInvoices > 0) {
      items.push({
        count: data.unpaidInvoices,
        label: data.unpaidInvoices === 1 ? "unpaid invoice" : "unpaid invoices",
        href: "/dashboard/finance/invoices",
        color: "text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      });
    }
    if (data.unreadMessages > 0) {
      items.push({
        count: data.unreadMessages,
        label: data.unreadMessages === 1 ? "unread message" : "unread messages",
        href: "/dashboard/inbox",
        color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        ),
      });
    }
  }

  const allCaughtUp = items.length === 0 && data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        {greeting}{name ? `, ${name}` : ""}
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</span>

        {items.length > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${item.color}`}
              >
                {item.icon}
                {item.count} {item.label}
              </Link>
            ))}
          </>
        )}

        {allCaughtUp && (
          <>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You&apos;re all caught up
            </span>
          </>
        )}
      </div>
    </div>
  );
}
