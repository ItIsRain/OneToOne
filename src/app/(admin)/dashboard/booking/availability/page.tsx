"use client";
import { AvailabilitySettings } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function AvailabilityPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.BOOKING_MANAGE}>
      <FeatureGate feature="booking">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Availability
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Set your team&apos;s weekly availability and date overrides
            </p>
          </div>
          <AvailabilitySettings />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
