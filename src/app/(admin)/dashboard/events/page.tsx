import type { Metadata } from "next";
import { EventsHub } from "@/components/agency";

export const metadata: Metadata = {
  title: "Events | Agency Portal",
  description: "Manage hackathons, speaking events, game jams, and more",
};

const eventStats = [
  { label: "Total Events", value: "24", change: "+3 this month" },
  { label: "Upcoming", value: "8", change: "Next 30 days" },
  { label: "Attendees Expected", value: "5,200", change: "+15% vs last month" },
  { label: "Revenue", value: "$124K", change: "From ticketed events" },
];

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Events</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage hackathons, speaking engagements, game jams, conferences, and more
        </p>
      </div>

      {/* Event Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {eventStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      <EventsHub />
    </div>
  );
}
