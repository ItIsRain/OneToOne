"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PortalLayoutProps {
  children: React.ReactNode;
  tenantName: string;
  logoUrl?: string;
  primaryColor?: string;
}

const navLinks = [
  {
    label: "Dashboard",
    href: "",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Files",
    href: "/files",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  tenantName,
  logoUrl,
  primaryColor = "#84cc16",
}) => {
  const pathname = usePathname();

  // Derive base path from pathname (e.g. /portal/tenant-slug)
  const segments = pathname.split("/");
  const basePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : "/portal";

  const handleLogout = async () => {
    // Invalidate session on server
    const portalClientId = localStorage.getItem("portal_client_id") || "";
    const sessionToken = localStorage.getItem("portal_session_token") || "";
    try {
      await fetch("/api/portal/auth/logout", {
        method: "POST",
        headers: {
          "x-portal-client-id": portalClientId,
          "x-portal-session-token": sessionToken,
        },
      });
    } catch {
      // Proceed with client-side logout regardless
    }
    localStorage.removeItem("portal_client_id");
    localStorage.removeItem("portal_session_token");
    localStorage.removeItem("portal_tenant_slug");
    localStorage.removeItem("portal_tenant_name");
    localStorage.removeItem("portal_logo_url");
    localStorage.removeItem("portal_primary_color");
    localStorage.removeItem("portal_tenant");
    window.location.href = basePath;
  };

  const isActive = (linkHref: string) => {
    const href = basePath + linkHref;
    return linkHref === ""
      ? pathname === basePath || pathname === basePath + "/"
      : pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Name */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={tenantName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                  {tenantName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-semibold text-white">
                {tenantName}
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const href = basePath + link.href;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="ml-4 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Logout
              </button>
            </nav>

            {/* Mobile: Logout button in header */}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 md:hidden"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — extra bottom padding on mobile for tab bar */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900 md:hidden"
        style={{ boxShadow: "0 -1px 3px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-stretch justify-around">
          {navLinks.map((link) => {
            const href = basePath + link.href;
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
                style={active ? { color: primaryColor } : undefined}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
