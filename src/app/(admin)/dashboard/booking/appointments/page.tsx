"use client";
import { AppointmentsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function AppointmentsPage() {
  return (
    <FeatureGate feature="booking">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Appointments
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and manage all booked appointments
          </p>
        </div>
        <AppointmentsTable />
      </div>
    </FeatureGate>
  );
}
