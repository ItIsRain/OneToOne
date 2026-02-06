"use client";
import { NotificationsTable } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function NotificationsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Stay updated on activity
        </p>
      </div>
      <NotificationsTable />
      </div>
    </ProtectedPage>
  );
}
