"use client";

import React, { useState } from "react";

interface PortalLoginProps {
  tenantSlug: string;
  tenantName: string;
  logoUrl?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  initialError?: string | null;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  tenantSlug,
  tenantName,
  logoUrl,
  welcomeMessage,
  primaryColor = "#84cc16",
  initialError = null,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { email, tenant_slug: tenantSlug };
      if (!useMagicLink) {
        body.password = password;
      }
      body.method = useMagicLink ? "magic_link" : "password";

      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      if (useMagicLink) {
        setMagicLinkSent(true);
        return;
      }

      // Store auth info
      localStorage.setItem("portal_client_id", data.portal_client.id);
      localStorage.setItem("portal_session_token", data.session_token);
      localStorage.setItem("portal_tenant_slug", tenantSlug);
      localStorage.setItem("portal_tenant_name", data.tenant?.name || tenantName);
      if (data.tenant?.logo_url) {
        localStorage.setItem("portal_logo_url", data.tenant.logo_url);
      }
      localStorage.setItem("portal_primary_color", primaryColor || "#84cc16");
      localStorage.setItem(
        "portal_tenant",
        JSON.stringify({
          slug: tenantSlug,
          name: data.tenant?.name || tenantName,
          logoUrl: data.tenant?.logo_url || logoUrl,
          primaryColor,
        })
      );

      // Redirect to dashboard
      window.location.href = `/portal/${tenantSlug}/dashboard`;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
          {/* Logo & Branding */}
          <div className="mb-6 flex flex-col items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {tenantName}
            </h1>
            {welcomeMessage && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {welcomeMessage}
              </p>
            )}
          </div>

          {magicLinkSent ? (
            <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              A magic link has been sent to <strong>{email}</strong>. Please
              check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  style={
                    { "--tw-ring-color": primaryColor } as React.CSSProperties
                  }
                  placeholder="you@example.com"
                />
              </div>

              {!useMagicLink && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!useMagicLink}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-transparent focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    style={
                      {
                        "--tw-ring-color": primaryColor,
                      } as React.CSSProperties
                    }
                    placeholder="Enter your password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {loading
                  ? "Please wait..."
                  : useMagicLink
                    ? "Send Magic Link"
                    : "Sign In"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseMagicLink(!useMagicLink);
                    setError(null);
                  }}
                  className="text-sm font-medium transition-colors hover:underline"
                  style={{ color: primaryColor }}
                >
                  {useMagicLink
                    ? "Sign in with password"
                    : "Send Magic Link instead"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
