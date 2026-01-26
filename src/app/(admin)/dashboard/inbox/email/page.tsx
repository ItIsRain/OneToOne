import type { Metadata } from "next";
import { EmailBroadcast } from "@/components/agency";

export const metadata: Metadata = {
  title: "Email Broadcast | Inbox",
  description: "Send broadcast emails to your contacts",
};

export default function EmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Email Broadcast
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Send announcements and updates to your contacts
        </p>
      </div>
      <EmailBroadcast />
    </div>
  );
}
