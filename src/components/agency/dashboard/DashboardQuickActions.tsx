"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GroupIcon, CalenderIcon, TaskIcon, DollarLineIcon } from "@/icons";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: "New Client",
    description: "Add a new client",
    href: "/dashboard/crm/clients",
    icon: <GroupIcon className="size-5" />,
    iconBg: "bg-brand-100 dark:bg-brand-500/15",
    iconColor: "text-brand-600 dark:text-brand-400",
  },
  {
    title: "New Event",
    description: "Schedule an event",
    href: "/dashboard/events",
    icon: <CalenderIcon className="size-5" />,
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "New Task",
    description: "Create a task",
    href: "/dashboard/tasks",
    icon: <TaskIcon className="size-5" />,
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "New Invoice",
    description: "Create an invoice",
    href: "/dashboard/finance/invoices",
    icon: <DollarLineIcon className="size-5" />,
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export const DashboardQuickActions: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch from framer-motion animations
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900 animate-pulse"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {quickActions.map((action) => (
        <motion.div key={action.title} variants={item}>
          <Link
            href={action.href}
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:border-gray-200 hover:scale-[1.02] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 cursor-pointer"
          >
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${action.iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <span className={action.iconColor}>{action.icon}</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {action.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                {action.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};
