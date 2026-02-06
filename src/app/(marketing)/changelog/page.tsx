import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog - OneToOne",
  description: "Stay up to date with the latest features, improvements, and bug fixes in OneToOne.",
};

const releases = [
  {
    version: "2.4.0",
    date: "February 2026",
    type: "Feature",
    title: "Workflow Automation",
    description: "Introducing powerful workflow automation to streamline your operations. Create custom triggers, automate repetitive tasks, and build complex workflows without code.",
    highlights: [
      "37 trigger types including client, project, and invoice events",
      "31 action types for tasks, notifications, and approvals",
      "Visual workflow builder with drag-and-drop interface",
      "Run history and execution tracking",
    ],
  },
  {
    version: "2.3.0",
    date: "January 2026",
    type: "Feature",
    title: "Advanced Contracts & E-Signatures",
    description: "Complete contract lifecycle management with built-in e-signature support. Create, send, track, and sign contracts all within OneToOne.",
    highlights: [
      "Contract templates with dynamic fields",
      "Secure e-signature workflow",
      "Contract status tracking and reminders",
      "PDF generation and export",
    ],
  },
  {
    version: "2.2.0",
    date: "December 2025",
    type: "Feature",
    title: "Event Booking System",
    description: "A complete booking system for events. Let attendees register, manage tickets, and track attendance seamlessly.",
    highlights: [
      "Public booking pages with custom branding",
      "Appointment scheduling and reminders",
      "Automated email confirmations",
      "Check-in and attendance tracking",
    ],
  },
  {
    version: "2.1.0",
    date: "November 2025",
    type: "Improvement",
    title: "Enhanced Reporting",
    description: "Comprehensive reporting improvements with new financial reports, team utilization insights, and custom report builder.",
    highlights: [
      "Financial profitability reports",
      "Team utilization dashboards",
      "Custom report builder",
      "Export to PDF and Excel",
    ],
  },
  {
    version: "2.0.0",
    date: "October 2025",
    type: "Major",
    title: "OneToOne 2.0",
    description: "A major platform update with a redesigned interface, improved performance, and powerful new features across all modules.",
    highlights: [
      "Completely redesigned dashboard",
      "50% faster page load times",
      "Dark mode support",
      "Mobile-responsive design",
      "Multi-tenant architecture",
    ],
  },
  {
    version: "1.8.0",
    date: "September 2025",
    type: "Feature",
    title: "Invoice Management",
    description: "Professional invoicing with payment tracking, automated reminders, and multiple payment method support.",
    highlights: [
      "Customizable invoice templates",
      "Online payment integration",
      "Automated payment reminders",
      "Invoice status tracking",
    ],
  },
  {
    version: "1.7.0",
    date: "August 2025",
    type: "Feature",
    title: "Team Time Tracking",
    description: "Track time spent on projects and tasks with detailed reporting and payroll integration.",
    highlights: [
      "Project-based time tracking",
      "Timer and manual entry",
      "Time entry approval workflow",
      "Payroll integration",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              What's new in
              <span className="block text-lime-500">OneToOne</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              Stay up to date with the latest features, improvements, and updates.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-12">
              {releases.map((release, idx) => (
                <div key={idx} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white dark:border-gray-950 ${
                    release.type === "Major" ? "bg-lime-500" :
                    release.type === "Feature" ? "bg-blue-500" :
                    "bg-gray-400"
                  }`} />

                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full">
                        v{release.version}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {release.date}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        release.type === "Major" ? "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400" :
                        release.type === "Feature" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        {release.type}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {release.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {release.description}
                    </p>

                    <ul className="space-y-2">
                      {release.highlights.map((highlight, hidx) => (
                        <li key={hidx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 text-lime-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
