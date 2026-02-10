"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardGreetingProps {
  firstName?: string;
  overdueTasks?: number;
  todayEvents?: number;
  unpaidInvoices?: number;
  isLoading?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getTimeIcon(): React.ReactNode {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    // Morning sun
    return (
      <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
    );
  }
  if (hour >= 12 && hour < 18) {
    // Afternoon
    return (
      <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12z" />
      </svg>
    );
  }
  // Evening/night moon
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
    </svg>
  );
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
  iconBg: string;
  icon: React.ReactNode;
}

export function DashboardGreeting({
  firstName,
  overdueTasks = 0,
  todayEvents = 0,
  unpaidInvoices = 0,
  isLoading = false
}: DashboardGreetingProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch from time-based rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const greeting = getGreeting();
  const dateStr = formatDate();

  // Show skeleton during SSR and initial load to prevent hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div>
        <div className="mb-2 h-9 w-72 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const items: AttentionItem[] = [];
  if (overdueTasks > 0) {
    items.push({
      count: overdueTasks,
      label: overdueTasks === 1 ? "overdue task" : "overdue tasks",
      href: "/dashboard/projects/tasks",
      color: "text-error-600 dark:text-error-400",
      iconBg: "bg-error-100 dark:bg-error-500/15",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }
  if (todayEvents > 0) {
    items.push({
      count: todayEvents,
      label: todayEvents === 1 ? "event today" : "events today",
      href: "/dashboard/events",
      color: "text-brand-600 dark:text-brand-400",
      iconBg: "bg-brand-100 dark:bg-brand-500/15",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    });
  }
  if (unpaidInvoices > 0) {
    items.push({
      count: unpaidInvoices,
      label: unpaidInvoices === 1 ? "unpaid invoice" : "unpaid invoices",
      href: "/dashboard/finance/invoices",
      color: "text-warning-600 dark:text-warning-400",
      iconBg: "bg-warning-100 dark:bg-warning-500/15",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  const allCaughtUp = items.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
    >
      <div className="flex items-center gap-2 mb-1">
        {getTimeIcon()}
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{dateStr}</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
        {greeting}{firstName ? ", " : ""}
        {firstName && <span className="text-brand-500">{firstName}</span>}
      </h1>

      {/* Attention items */}
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm ${item.iconBg} ${item.color}`}
            >
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                {item.icon}
              </span>
              <span className="font-semibold">{item.count}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {allCaughtUp && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You&apos;re all caught up
          </span>
        </div>
      )}
    </motion.div>
  );
}
