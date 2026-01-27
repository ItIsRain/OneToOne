"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DomainData {
  subdomain: string;
  subdomainUrl: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainSslStatus: string | null;
  customDomainSslStatusMessage: string | null;
  customDomainFeatureEnabled: boolean;
  planType: string;
  fallbackOrigin: string;
}

interface DnsInstructions {
  type: string;
  host: string;
  value: string;
  note?: string;
}

// Settings card component
const SettingsCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient?: string;
}> = ({ title, subtitle, icon, children, gradient = "from-brand-500 to-brand-600" }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700">
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

// Info item component
const InfoItem: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-center gap-3 py-2">
    {icon && (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
        {value || "-"}
      </div>
    </div>
  </div>
);

// SSL Status badge component
const SSLStatusBadge: React.FC<{ status: string | null; verified: boolean }> = ({ status, verified }) => {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        SSL Active
      </span>
    );
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    initializing: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Initializing" },
    pending_validation: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Awaiting CNAME" },
    pending_issuance: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Issuing SSL" },
    pending_deployment: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Deploying" },
    active: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
  };

  const config = statusConfig[status || ""] || { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Pending" };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {status === "pending_validation" ? (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {config.label}
    </span>
  );
};

// DNS Instructions Panel (simplified for CNAME only)
const DnsInstructionsPanel: React.FC<{
  instructions: DnsInstructions;
  sslStatus: string | null;
  sslStatusMessage: string | null;
  onCopy: (text: string) => void;
}> = ({ instructions, sslStatus, sslStatusMessage, onCopy }) => (
  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-blue-800 dark:text-blue-300">Add CNAME Record</h4>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
          Add this record in your domain&apos;s DNS settings. SSL will be automatically provisioned.
        </p>

        {/* CNAME Record */}
        <div className="mt-4">
          <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-700 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="font-mono font-semibold text-gray-800 dark:text-gray-200">CNAME</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name / Host</p>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-gray-800 dark:text-gray-200 truncate">{instructions.host}</p>
                  <button
                    onClick={() => onCopy(instructions.host)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                    title="Copy"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Target / Value</p>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-gray-800 dark:text-gray-200">{instructions.value}</p>
                  <button
                    onClick={() => onCopy(instructions.value)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                    title="Copy"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SSL Status */}
        {sslStatusMessage && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{sslStatusMessage}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Upgrade prompt component
const UpgradePrompt: React.FC = () => (
  <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Custom Domain</h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Use your own domain (e.g., portal.yourcompany.com) to provide a fully branded experience. SSL certificates are automatically provisioned.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-violet-600 hover:to-purple-700 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Upgrade to Business
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Available on Business plan
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const DomainSettings: React.FC = () => {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDomainSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/domains");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch domain settings");
      }

      setDomainData(data);

      // If there's a custom domain that's not verified, show DNS instructions
      if (data.customDomain && !data.customDomainVerified) {
        setDnsInstructions({
          type: "CNAME",
          host: data.customDomain,
          value: data.fallbackOrigin || "portal.1i1.ae",
        });
      } else {
        setDnsInstructions(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch domain settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomainSettings();
  }, [fetchDomainSettings]);

  // Auto-refresh status when domain is pending
  useEffect(() => {
    if (domainData?.customDomain && !domainData?.customDomainVerified) {
      const interval = setInterval(() => {
        fetchDomainSettings();
      }, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [domainData?.customDomain, domainData?.customDomainVerified, fetchDomainSettings]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleAddCustomDomain = async () => {
    if (!customDomainInput.trim()) {
      setErrorMessage("Please enter a domain");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/settings/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: customDomainInput.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add custom domain");
      }

      setSuccessMessage(data.message);
      if (data.dnsInstructions) {
        setDnsInstructions(data.dnsInstructions);
      }
      setCustomDomainInput("");
      await fetchDomainSettings();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add custom domain");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckStatus = async () => {
    setVerifying(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/settings/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check status");
      }

      if (data.verified) {
        setSuccessMessage(data.message);
        setDnsInstructions(null);
      } else {
        setSuccessMessage(data.helpMessage || data.sslStatusMessage);
      }

      await fetchDomainSettings();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Are you sure you want to remove your custom domain?")) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/settings/domains", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove custom domain");
      }

      setSuccessMessage(data.message);
      setDnsInstructions(null);
      await fetchDomainSettings();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove custom domain");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchDomainSettings}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const inputClasses = "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500";

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Subdomain Card (Read-only) */}
      <SettingsCard
        title="Portal Subdomain"
        subtitle="Your default portal URL"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        }
        gradient="from-cyan-500 to-blue-600"
      >
        <InfoItem
          label="Your Portal URL"
          value={
            <a
              href={domainData?.subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:text-brand-600 font-mono"
            >
              {domainData?.subdomainUrl}
            </a>
          }
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This is your default portal URL. All your public events and registration pages are accessible here.
        </p>
      </SettingsCard>

      {/* Custom Domain Card */}
      <SettingsCard
        title="Custom Domain"
        subtitle="Use your own domain for a branded experience"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        gradient="from-violet-500 to-purple-600"
      >
        {!domainData?.customDomainFeatureEnabled ? (
          <UpgradePrompt />
        ) : domainData?.customDomain ? (
          // Custom domain configured
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <InfoItem
                label="Custom Domain"
                value={
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://${domainData.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600 font-mono"
                    >
                      {domainData.customDomain}
                    </a>
                    <SSLStatusBadge
                      status={domainData.customDomainSslStatus}
                      verified={domainData.customDomainVerified}
                    />
                  </div>
                }
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                }
              />
            </div>

            {/* DNS Instructions if not verified */}
            {!domainData.customDomainVerified && dnsInstructions && (
              <DnsInstructionsPanel
                instructions={dnsInstructions}
                sslStatus={domainData.customDomainSslStatus}
                sslStatusMessage={domainData.customDomainSslStatusMessage}
                onCopy={handleCopy}
              />
            )}

            {/* Verified success message */}
            {domainData.customDomainVerified && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-sm font-medium">SSL certificate is active. Your custom domain is working!</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {!domainData.customDomainVerified && (
                <button
                  onClick={handleCheckStatus}
                  disabled={verifying}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {verifying ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Status
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRemoveDomain}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove Domain
              </button>
            </div>
          </div>
        ) : (
          // No custom domain configured
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your own domain to provide a fully branded experience. Just add a CNAME record - SSL is automatically provisioned!
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Enter your domain
                </label>
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  className={inputClasses}
                  placeholder="portal.yourcompany.com"
                />
              </div>
              <button
                onClick={handleAddCustomDomain}
                disabled={saving || !customDomainInput.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Domain
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              After adding, you&apos;ll need to add a CNAME record pointing to <span className="font-mono">{domainData?.fallbackOrigin || "portal.1i1.ae"}</span>
            </p>
          </div>
        )}
      </SettingsCard>
    </div>
  );
};

export default DomainSettings;
