"use client";
import React from "react";
import Link from "next/link";
import { GroupIcon, CalenderIcon, TaskIcon, DollarLineIcon } from "@/icons";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: "New Client",
    description: "Add a new client",
    href: "/dashboard/crm/clients",
    icon: <GroupIcon className="size-5" />,
    color: "text-brand-500",
    bgColor: "bg-brand-500/10",
  },
  {
    title: "New Event",
    description: "Schedule an event",
    href: "/dashboard/events",
    icon: <CalenderIcon className="size-5" />,
    color: "text-warning-500",
    bgColor: "bg-warning-500/10",
  },
  {
    title: "New Task",
    description: "Create a task",
    href: "/dashboard/tasks",
    icon: <TaskIcon className="size-5" />,
    color: "text-success-500",
    bgColor: "bg-success-500/10",
  },
  {
    title: "New Invoice",
    description: "Create an invoice",
    href: "/dashboard/finance/invoices",
    icon: <DollarLineIcon className="size-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export const DashboardQuickActions: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${action.bgColor}`}>
              <span className={action.color}>{action.icon}</span>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {action.title}
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
