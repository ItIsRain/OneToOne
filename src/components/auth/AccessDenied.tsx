'use client';

import Link from 'next/link';

interface AccessDeniedProps {
  /**
   * Custom title (default: "Access Denied")
   */
  title?: string;

  /**
   * Custom message
   */
  message?: string;

  /**
   * Show back to dashboard link
   */
  showBackLink?: boolean;

  /**
   * Custom back link URL
   */
  backUrl?: string;

  /**
   * Compact variant for inline display
   */
  compact?: boolean;
}

/**
 * AccessDenied - Displayed when user lacks permission to access a page/feature
 */
export function AccessDenied({
  title = 'Access Denied',
  message = "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
  showBackLink = true,
  backUrl = '/dashboard',
  compact = false,
}: AccessDeniedProps) {
  if (compact) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-yellow-600 dark:text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
          {message}
        </p>
        {showBackLink && (
          <Link
            href={backUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export default AccessDenied;
