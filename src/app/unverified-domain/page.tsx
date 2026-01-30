import { Metadata } from "next";
import Link from "next/link";
import { getMainUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Domain Pending Verification",
  description: "This custom domain is pending DNS verification.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnverifiedDomainPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30">
            <svg
              className="h-12 w-12 text-amber-500 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          Domain Pending Verification
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          This custom domain has been configured but is still pending DNS verification.
          The portal owner needs to complete the setup.
        </p>

        {/* Info Box */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-left dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                For Portal Owners
              </h2>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                To complete the setup, log in to your dashboard and navigate to
                Settings &rarr; Domains to verify your domain ownership via DNS records.
              </p>
            </div>
          </div>
        </div>

        {/* Steps for portal owner */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-left dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Steps to verify:
          </h2>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                1
              </span>
              Log in to your dashboard
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                2
              </span>
              Go to Settings &rarr; Domains
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                3
              </span>
              Add the required DNS TXT record
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                4
              </span>
              Click &quot;Verify Domain&quot; to complete setup
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={getMainUrl("/signin")}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-600"
          >
            Sign In to Dashboard
          </Link>
          <Link
            href={getMainUrl()}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Lunar Labs
      </p>
    </div>
  );
}
