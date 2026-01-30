"use client";
import { use, useState, useEffect } from "react";
import { PublicFormRenderer } from "@/components/form/PublicFormRenderer";
import { DotPattern } from "@/components/ui/magic";
import type { PublicForm } from "@/components/agency/FormsTable";
interface TenantInfo {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

const DEFAULT_ACCENT = "#84cc16";

export default function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [form, setForm] = useState<PublicForm | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const accentColor = tenant?.primary_color || DEFAULT_ACCENT;

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`/api/forms/public/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!data || !data.form) {
          setNotFound(true);
          return;
        }
        setForm(data.form);
        if (data.tenant) {
          setTenant(data.tenant);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${DEFAULT_ACCENT}33`, borderTopColor: "transparent", borderRightColor: DEFAULT_ACCENT }}
          />
          <p className="text-sm text-gray-400 animate-pulse">Loading form...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !form) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gray-950 overflow-hidden">
        <DotPattern className="opacity-20" />
        <div className="relative z-10 mx-auto max-w-md text-center px-4">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/50 border border-gray-700/50">
            <svg className="h-10 w-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Form Not Found</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            This form does not exist or is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark relative min-h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Background pattern */}
      <DotPattern className="opacity-15" />

      {/* Gradient orbs for ambiance */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 blur-3xl"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}40, transparent 70%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center gap-3 px-4 py-4 sm:px-6">
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name || "Logo"}
              className="h-9 w-auto max-w-[160px] object-contain brightness-0 invert"
            />
          ) : tenant?.name ? (
            <span className="text-lg font-bold text-white tracking-tight">
              {tenant.name}
            </span>
          ) : null}
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Form title card */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-2 text-base text-gray-400 leading-relaxed">
                {form.description}
              </p>
            )}
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900/80 backdrop-blur-sm p-6 sm:p-8">
            <PublicFormRenderer form={form} accentColor={accentColor} />
          </div>

          {/* Privacy notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Your data is securely submitted and protected.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center justify-center px-4 py-4 sm:px-6">
          <span className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {tenant?.name || ""}. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
