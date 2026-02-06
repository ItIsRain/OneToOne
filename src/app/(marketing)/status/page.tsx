import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status - OneToOne",
  description: "Check the current status of OneToOne services. View uptime, incidents, and maintenance updates.",
};

const services = [
  { name: "Web Application", status: "operational", uptime: "99.99%" },
  { name: "API", status: "operational", uptime: "99.98%" },
  { name: "Database", status: "operational", uptime: "99.99%" },
  { name: "File Storage", status: "operational", uptime: "99.97%" },
  { name: "Email Delivery", status: "operational", uptime: "99.95%" },
  { name: "Webhooks", status: "operational", uptime: "99.96%" },
];

const incidents = [
  {
    date: "February 3, 2026",
    title: "Scheduled Maintenance",
    status: "completed",
    description: "Brief maintenance window for database optimization. No downtime reported.",
  },
  {
    date: "January 28, 2026",
    title: "API Latency Increase",
    status: "resolved",
    description: "Increased API response times for approximately 15 minutes. Issue identified and resolved.",
  },
  {
    date: "January 15, 2026",
    title: "Email Delivery Delays",
    status: "resolved",
    description: "Some email notifications were delayed by up to 30 minutes due to third-party provider issues.",
  },
];

const uptimeData = [
  { day: "Mon", value: 100 },
  { day: "Tue", value: 100 },
  { day: "Wed", value: 99.8 },
  { day: "Thu", value: 100 },
  { day: "Fri", value: 100 },
  { day: "Sat", value: 100 },
  { day: "Sun", value: 100 },
];

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${
              allOperational
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-yellow-100 dark:bg-yellow-900/30"
            }`}>
              <span className={`w-3 h-3 rounded-full ${
                allOperational ? "bg-green-500" : "bg-yellow-500"
              }`} />
              <span className={`text-sm font-medium ${
                allOperational
                  ? "text-green-700 dark:text-green-400"
                  : "text-yellow-700 dark:text-yellow-400"
              }`}>
                {allOperational ? "All Systems Operational" : "Partial Service Disruption"}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              System
              <span className="text-lime-500"> Status</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Real-time status of all OneToOne services.
            </p>
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Service Status
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    service.status === "operational" ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {service.uptime} uptime
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    service.status === "operational"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    {service.status === "operational" ? "Operational" : "Degraded"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Uptime Graph */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Uptime - Last 7 Days
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-end justify-between gap-2 h-32">
              {uptimeData.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t ${
                      day.value === 100 ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{ height: `${day.value}%` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Average uptime: 99.97%
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-yellow-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">&lt;100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Recent Incidents
          </h2>
          <div className="space-y-4">
            {incidents.map((incident, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {incident.date}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    incident.status === "completed"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  }`}>
                    {incident.status}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {incident.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {incident.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Get notified of status updates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Subscribe to receive email notifications about incidents and maintenance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            <button className="w-full sm:w-auto px-6 py-3 bg-lime-500 text-white font-semibold rounded-xl hover:bg-lime-600 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
