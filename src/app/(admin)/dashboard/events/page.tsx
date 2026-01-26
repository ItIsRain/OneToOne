import type { Metadata } from "next";
import { EventsTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Events | Agency Portal",
  description: "Manage hackathons, speaking events, game jams, and more",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Events</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage hackathons, speaking engagements, game jams, conferences, and more
        </p>
      </div>

      <EventsTable />
    </div>
  );
}
