"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/Logo.svg"
                alt="OneToOne"
                width={160}
                height={52}
                className="h-13 w-auto dark:brightness-0 dark:invert"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contact
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg hover:bg-lime-600 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col gap-4">
                <Link href="/features" className="text-sm text-gray-600 dark:text-gray-400">Features</Link>
                <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400">Pricing</Link>
                <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400">About</Link>
                <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-400">Contact</Link>
                <Link href="/signin" className="text-sm text-gray-600 dark:text-gray-400">Sign In</Link>
                <Link href="/signup" className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg text-center">
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-white pt-20 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-gray-800">
            <div className="col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src="/Logo.svg"
                  alt="OneToOne"
                  width={180}
                  height={60}
                  className="h-14 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs">
                The all-in-one platform for managing your organization's clients, projects, events, and finances.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/1i1.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-lime-500 hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-lime-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-lime-400 transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-lime-400 transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-lime-400 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-lime-400 transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-lime-400 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-lime-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-lime-400 transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-lime-400 transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-lime-400 transition-colors">API Reference</Link></li>
                <li><Link href="/status" className="hover:text-lime-400 transition-colors">Status</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-lime-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-lime-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-lime-400 transition-colors">Cookie Policy</Link></li>
                <li><Link href="/security" className="hover:text-lime-400 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} One To One (1i1.ae) by Lunar Limited. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-gray-600">Made with</span>
              <div className="flex items-center gap-2">
                <span className="text-lime-500">♥</span>
                <span className="text-xs text-gray-500">for teams everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
