import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - OneToOne",
  description: "Comprehensive documentation for OneToOne. Learn how to use every feature effectively.",
};

const sections = [
  {
    title: "Quick Start",
    description: "Get up and running in minutes",
    links: [
      { title: "Introduction", href: "#" },
      { title: "Creating an Account", href: "#" },
      { title: "Initial Setup", href: "#" },
      { title: "Your First Project", href: "#" },
    ],
  },
  {
    title: "Core Concepts",
    description: "Understanding the fundamentals",
    links: [
      { title: "Organizations & Tenants", href: "#" },
      { title: "Users & Roles", href: "#" },
      { title: "Projects & Tasks", href: "#" },
      { title: "Clients & Contacts", href: "#" },
    ],
  },
  {
    title: "Features",
    description: "Deep dive into each module",
    links: [
      { title: "CRM & Pipeline", href: "#" },
      { title: "Project Management", href: "#" },
      { title: "Event Management", href: "#" },
      { title: "Finance & Invoicing", href: "#" },
      { title: "Team Management", href: "#" },
      { title: "Document Management", href: "#" },
    ],
  },
  {
    title: "Integrations",
    description: "Connect with other tools",
    links: [
      { title: "Available Integrations", href: "/integrations" },
      { title: "Zapier Setup", href: "#" },
      { title: "Webhooks", href: "#" },
      { title: "OAuth Apps", href: "#" },
    ],
  },
  {
    title: "API Reference",
    description: "Build custom integrations",
    links: [
      { title: "API Overview", href: "/api" },
      { title: "Authentication", href: "#" },
      { title: "REST Endpoints", href: "#" },
      { title: "Rate Limits", href: "#" },
    ],
  },
  {
    title: "Advanced",
    description: "Power user features",
    links: [
      { title: "Workflow Automation", href: "#" },
      { title: "Custom Fields", href: "#" },
      { title: "Bulk Operations", href: "#" },
      { title: "Data Export", href: "#" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Documentation
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about using OneToOne effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.links.map((link, lidx) => (
                    <li key={lidx}>
                      <Link
                        href={link.href}
                        className="text-sm text-lime-600 dark:text-lime-400 hover:underline flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Quick Links
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/api"
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-lime-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">API Reference</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build custom integrations</p>
              </div>
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-lime-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Help Center</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get support and answers</p>
              </div>
            </Link>
            <Link
              href="/changelog"
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-lime-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Changelog</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">See what&apos;s new</p>
              </div>
            </Link>
            <Link
              href="/status"
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-lime-500/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-600 dark:text-lime-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">System Status</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check service health</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
