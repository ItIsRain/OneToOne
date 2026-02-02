"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalLogin } from "@/components/portal/PortalLogin";

export default function PortalLoginPage({
  params,
}: {
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": tenantSlug } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(!!token);

  useEffect(() => {
    if (!token) return;

    const loginWithToken = async () => {
      try {
        const res = await fetch("/api/portal/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, tenant_slug: tenantSlug }),
        });

        const data = await res.json();

        if (!res.ok) {
          setAutoLoginError(data.error || "Magic link login failed");
          setProcessing(false);
          return;
        }

        // Store auth info
        localStorage.setItem("portal_client_id", data.portal_client.id);
        localStorage.setItem("portal_session_token", data.session_token);
        localStorage.setItem("portal_tenant_slug", tenantSlug);
        localStorage.setItem("portal_tenant_name", data.tenant?.name || tenantSlug);
        if (data.tenant?.logo_url) {
          localStorage.setItem("portal_logo_url", data.tenant.logo_url);
        }
        localStorage.setItem("portal_primary_color", "#84cc16");
        localStorage.setItem(
          "portal_tenant",
          JSON.stringify({
            slug: tenantSlug,
            name: data.tenant?.name || tenantSlug,
            logoUrl: data.tenant?.logo_url || "",
            primaryColor: "#84cc16",
          })
        );

        window.location.href = `/portal/${tenantSlug}/dashboard`;
      } catch {
        setAutoLoginError("Something went wrong. Please try logging in manually.");
        setProcessing(false);
      }
    };

    loginWithToken();
  }, [token, tenantSlug]);

  if (processing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Signing you in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalLogin
      tenantSlug={tenantSlug}
      tenantName={tenantSlug}
      initialError={autoLoginError}
    />
  );
}
