import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - OneToOne",
  description: "Learn about how OneToOne uses cookies and similar technologies.",
};

const cookieTypes = [
  {
    name: "Essential Cookies",
    description: "Required for the website to function. Cannot be disabled.",
    required: true,
    cookies: [
      { name: "session_id", purpose: "Maintains your login session", duration: "Session" },
      { name: "csrf_token", purpose: "Protects against cross-site request forgery", duration: "Session" },
      { name: "consent", purpose: "Stores your cookie preferences", duration: "1 year" },
    ],
  },
  {
    name: "Functional Cookies",
    description: "Enable enhanced functionality and personalization.",
    required: false,
    cookies: [
      { name: "theme", purpose: "Remembers your dark/light mode preference", duration: "1 year" },
      { name: "language", purpose: "Stores your language preference", duration: "1 year" },
      { name: "sidebar_state", purpose: "Remembers sidebar collapsed state", duration: "30 days" },
    ],
  },
  {
    name: "Analytics Cookies",
    description: "Help us understand how visitors use our website.",
    required: false,
    cookies: [
      { name: "_ga", purpose: "Google Analytics - distinguishes users", duration: "2 years" },
      { name: "_gid", purpose: "Google Analytics - distinguishes users", duration: "24 hours" },
      { name: "_gat", purpose: "Google Analytics - throttles request rate", duration: "1 minute" },
    ],
  },
];

const sections = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies?",
    content: "Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience. Cookies can be \"session\" cookies (deleted when you close your browser) or \"persistent\" cookies (remain until they expire or you delete them).",
  },
  {
    id: "how-we-use",
    title: "How We Use Cookies",
    content: "We use cookies and similar technologies to provide, protect, and improve our services. This includes remembering your preferences, understanding how you use our platform, and showing you relevant content.",
  },
  {
    id: "managing-cookies",
    title: "Managing Cookies",
    content: "Most web browsers allow you to control cookies through their settings. You can view, delete, or block cookies from specific or all websites. Please note that disabling certain cookies may impact your experience on our platform.",
  },
  {
    id: "third-party",
    title: "Third-Party Cookies",
    content: "Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third parties include analytics providers (like Google Analytics) and payment processors.",
  },
  {
    id: "updates",
    title: "Updates to This Policy",
    content: "We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.",
  },
];

export default function CookiesPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-sm font-medium text-lime-600 dark:text-lime-400 mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Cookie Policy
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Last updated: February 1, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Intro Sections */}
        <div className="space-y-8 mb-12">
          {sections.slice(0, 2).map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Cookie Types Table */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Cookies We Use
          </h2>
          <div className="space-y-6">
            {cookieTypes.map((type, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                  {type.required ? (
                    <span className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      Required
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-medium bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-200 dark:border-gray-800">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cookie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {type.cookies.map((cookie, cidx) => (
                        <tr key={cidx}>
                          <td className="px-6 py-3 text-gray-900 dark:text-white font-mono text-xs">
                            {cookie.name}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                            {cookie.purpose}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                            {cookie.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Remaining Sections */}
        <div className="space-y-8 mb-12">
          {sections.slice(2).map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Browser Settings */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Browser Cookie Settings
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { browser: "Chrome", path: "Settings → Privacy and Security → Cookies" },
              { browser: "Firefox", path: "Settings → Privacy & Security → Cookies" },
              { browser: "Safari", path: "Preferences → Privacy → Cookies" },
              { browser: "Edge", path: "Settings → Privacy & Services → Cookies" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <p className="font-medium text-gray-900 dark:text-white">{item.browser}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.path}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Contact Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:privacy@1i1.ae" className="text-lime-600 dark:text-lime-400 hover:underline">
              privacy@1i1.ae
            </a>
          </p>
        </section>

        {/* Footer Links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Related policies</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Terms of Service
            </Link>
            <Link href="/security" className="text-sm text-lime-600 dark:text-lime-400 hover:underline">
              Security
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
