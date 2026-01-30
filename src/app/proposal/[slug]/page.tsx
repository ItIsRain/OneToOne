"use client";
import { use, useEffect, useState } from "react";
import { PublicProposalView } from "@/components/proposal/PublicProposalView";
import { DotPattern } from "@/components/ui/magic";

interface TenantInfo {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

export default function PublicProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proposal, setProposal] = useState<any>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/proposals/public/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setProposal(data.proposal || data);
        if (data.tenant) {
          setTenant(data.tenant);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProposal();
  }, [slug]);

  const accentColor = tenant?.primary_color || "#3b82f6";

  if (loading) {
    return (
      <div className="dark relative min-h-screen bg-gray-950 flex items-center justify-center">
        <DotPattern className="opacity-15" />
        <div className="relative z-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />
          <p className="mt-4 text-gray-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="dark relative min-h-screen bg-gray-950 flex items-center justify-center">
        <DotPattern className="opacity-15" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-white/90">404</h1>
          <p className="mt-2 text-gray-400">
            This proposal could not be found or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark relative min-h-screen bg-gray-950 flex flex-col overflow-hidden">
      <DotPattern className="opacity-15" />

      {/* Gradient orb */}
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
      <main className="relative z-10 flex-1 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/[0.08] bg-gray-900/80 backdrop-blur-sm overflow-hidden">
            <PublicProposalView proposal={proposal} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center justify-center px-4 py-4 sm:px-6">
          <span className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {tenant?.name || ""}. All rights
            reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
