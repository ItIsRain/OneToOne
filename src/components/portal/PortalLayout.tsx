"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PortalLayoutProps {
  children: React.ReactNode;
  tenantName: string;
  logoUrl?: string;
  primaryColor?: string;
}

const navLinks = [
  { label: "Dashboard", href: "" },
  { label: "Projects", href: "/projects" },
  { label: "Approvals", href: "/approvals" },
  { label: "Invoices", href: "/invoices" },
  { label: "Files", href: "/files" },
];

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  tenantName,
  logoUrl,
  primaryColor = "#84cc16",
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Derive base path from pathname (e.g. /portal/tenant-slug)
  const segments = pathname.split("/");
  const basePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : "/portal";

  const handleLogout = () => {
    localStorage.removeItem("portal_client_id");
    localStorage.removeItem("portal_tenant");
    window.location.href = basePath + "/login";
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
                const isActive =
                  link.href === ""
                    ? pathname === basePath || pathname === basePath + "/"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={link.label}
                    href={href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
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

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 md:hidden">
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => {
                const href = basePath + link.href;
                const isActive =
                  link.href === ""
                    ? pathname === basePath || pathname === basePath + "/"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={link.label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
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
                className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-medium text-white hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
