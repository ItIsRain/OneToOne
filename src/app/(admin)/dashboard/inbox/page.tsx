import type { Metadata } from "next";
import { MessagesTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Messages | Inbox",
  description: "Manage your team messages",
};

export default function InboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Messages
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your team conversations
        </p>
      </div>
      <MessagesTable />
    </div>
  );
}
