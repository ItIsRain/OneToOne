import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal Not Found",
  description: "This portal does not exist or has been removed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvalidSubdomainPage() {
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
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
            <svg
              className="h-12 w-12 text-red-500 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          Portal Not Found
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          The portal you&apos;re trying to access doesn&apos;t exist or may have been removed.
          Please check the URL and try again.
        </p>

        {/* Suggestions */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-left dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Suggestions:
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Double-check the portal URL for any typos
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Contact the portal owner for the correct link
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              The portal may have been renamed or deleted
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="https://1i1.ae"
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-600"
          >
            Go to OneToOne
          </Link>
          <Link
            href="https://1i1.ae/signup"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Create Your Portal
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} OneToOne by Lunar Labs
      </p>
    </div>
  );
}
