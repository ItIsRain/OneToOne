"use client";
import React from "react";
import Link from "next/link";
import { PlusIcon, GroupIcon, CalenderIcon, TaskIcon } from "@/icons";

export const QuickActions = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        Quick Actions
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10">
            <GroupIcon className="text-brand-500 size-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              New Client
            </p>
            <p className="text-gray-500 text-theme-xs dark:text-gray-400">
              Add a client
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/events"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-500/10">
            <CalenderIcon className="text-warning-500 size-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              New Event
            </p>
            <p className="text-gray-500 text-theme-xs dark:text-gray-400">
              Schedule event
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-500/10">
            <TaskIcon className="text-success-500 size-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              New Task
            </p>
            <p className="text-gray-500 text-theme-xs dark:text-gray-400">
              Create a task
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};
