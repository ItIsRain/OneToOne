"use client";
import { EmailBroadcast } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function EmailPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
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
    </ProtectedPage>
  );
}
