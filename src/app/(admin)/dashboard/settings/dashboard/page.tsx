import DashboardSettingsClient from "./DashboardSettingsClient";

export default function DashboardSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Dashboard Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize which widgets appear on your dashboard and their order.
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <DashboardSettingsClient />
      </div>
    </div>
  );
}
