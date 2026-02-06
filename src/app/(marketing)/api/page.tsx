import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference - OneToOne",
  description: "Complete API documentation for OneToOne. Build custom integrations with our REST API.",
};

const endpoints = [
  {
    category: "Authentication",
    description: "Secure access to the API",
    endpoints: [
      { method: "POST", path: "/auth/login", description: "Authenticate and get access token" },
      { method: "POST", path: "/auth/refresh", description: "Refresh access token" },
      { method: "POST", path: "/auth/logout", description: "Revoke access token" },
    ],
  },
  {
    category: "Clients",
    description: "Manage client records",
    endpoints: [
      { method: "GET", path: "/clients", description: "List all clients" },
      { method: "POST", path: "/clients", description: "Create a new client" },
      { method: "GET", path: "/clients/:id", description: "Get client details" },
      { method: "PATCH", path: "/clients/:id", description: "Update a client" },
      { method: "DELETE", path: "/clients/:id", description: "Delete a client" },
    ],
  },
  {
    category: "Projects",
    description: "Manage projects and tasks",
    endpoints: [
      { method: "GET", path: "/projects", description: "List all projects" },
      { method: "POST", path: "/projects", description: "Create a new project" },
      { method: "GET", path: "/projects/:id", description: "Get project details" },
      { method: "GET", path: "/projects/:id/tasks", description: "List project tasks" },
    ],
  },
  {
    category: "Events",
    description: "Manage events and attendees",
    endpoints: [
      { method: "GET", path: "/events", description: "List all events" },
      { method: "POST", path: "/events", description: "Create a new event" },
      { method: "GET", path: "/events/:id/attendees", description: "List event attendees" },
    ],
  },
  {
    category: "Invoices",
    description: "Manage invoices and payments",
    endpoints: [
      { method: "GET", path: "/invoices", description: "List all invoices" },
      { method: "POST", path: "/invoices", description: "Create a new invoice" },
      { method: "POST", path: "/invoices/:id/send", description: "Send invoice to client" },
    ],
  },
  {
    category: "Webhooks",
    description: "Real-time event notifications",
    endpoints: [
      { method: "GET", path: "/webhooks", description: "List webhook subscriptions" },
      { method: "POST", path: "/webhooks", description: "Create webhook subscription" },
      { method: "DELETE", path: "/webhooks/:id", description: "Delete webhook subscription" },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  POST: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  PATCH: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  DELETE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export default function ApiPage() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              API
              <span className="text-lime-500"> Reference</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Build powerful integrations with the OneToOne REST API. Full documentation for all endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Start
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300">
              <code>{`# Authenticate and get your API token
curl -X POST https://api.1i1.ae/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your-password"}'

# Use your token to make requests
curl https://api.1i1.ae/clients \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Endpoints
          </h2>

          <div className="space-y-8">
            {endpoints.map((category, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.category}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {category.endpoints.map((endpoint, eidx) => (
                    <div
                      key={eidx}
                      className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <span className={`px-2 py-1 text-xs font-bold rounded ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-gray-900 dark:text-white font-mono">
                        {endpoint.path}
                      </code>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto hidden sm:block">
                        {endpoint.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Rate Limits
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">1,000</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requests per minute</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">100,000</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requests per day</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">Unlimited</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise plans</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Need help with the API?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Our developer support team is here to help you build great integrations.
          </p>
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 bg-lime-500 text-white font-semibold rounded-xl hover:bg-lime-600 transition-colors"
          >
            Contact Developer Support
          </Link>
        </div>
      </section>
    </div>
  );
}
