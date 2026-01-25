import type { Metadata } from "next";
import { AgencyMetrics, ActivityFeed, QuickActions } from "@/components/agency";

export const metadata: Metadata = {
  title: "Dashboard | Agency Portal",
  description: "Agency Dashboard - Overview of clients, events, and business metrics",
};

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <AgencyMetrics />
      </div>

      <div className="col-span-12">
        <QuickActions />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <ActivityFeed />
      </div>
    </div>
  );
}
