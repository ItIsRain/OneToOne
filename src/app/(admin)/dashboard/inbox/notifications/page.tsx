import type { Metadata } from "next";
import { NotificationsTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Notifications | Inbox",
  description: "View your notifications",
};

export default function NotificationsPage() {
  return (
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
  );
}
