"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface PortalHeaderProps {
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export default function PortalHeader({ tenantName, logoUrl, primaryColor }: PortalHeaderProps) {
  const accentColor = primaryColor || "#84cc16";
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl" />
      {/* Accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Tenant branding */}
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-10 max-w-[200px] object-contain dark:brightness-0 dark:invert"
              />
            ) : (
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {tenantName}
              </span>
            )}
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Events
            </Link>
            {!loading && (
              user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: accentColor }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ backgroundColor: accentColor }}
                >
                  Sign In
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
