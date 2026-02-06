"use client";
import { EventsTable } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function EventsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.EVENTS_VIEW}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Events</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage hackathons, speaking engagements, game jams, conferences, and more
          </p>
        </div>

        <EventsTable />
      </div>
    </ProtectedPage>
  );
}
