"use client";
import { use, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PortalLayout } from "@/components/portal/PortalLayout";

interface TenantInfo {
  name: string;
  logo_url?: string;
  primary_color?: string;
}

export default function PortalLayoutPage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": tenantSlug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if this is the login page (root portal page)
  const isLoginPage =
    pathname === `/portal/${tenantSlug}` ||
    pathname === `/portal/${tenantSlug}/`;

  useEffect(() => {
    // If on login page, skip auth check
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Check for portal session
    const storedClientId = localStorage.getItem("portal_client_id");
    const storedTenantSlug = localStorage.getItem("portal_tenant_slug");

    if (!storedClientId || storedTenantSlug !== tenantSlug) {
      // Not logged in or wrong tenant
      router.push(`/portal/${tenantSlug}`);
      return;
    }

    // Get tenant info from localStorage (stored on login)
    const storedTenantName =
      localStorage.getItem("portal_tenant_name") || tenantSlug;
    const storedLogoUrl =
      localStorage.getItem("portal_logo_url") || undefined;
    const storedColor =
      localStorage.getItem("portal_primary_color") || "#84cc16";

    setTenantInfo({
      name: storedTenantName,
      logo_url: storedLogoUrl,
      primary_color: storedColor,
    });
    setLoading(false);
  }, [tenantSlug, router, isLoginPage]);

  // Login page: render children directly without PortalLayout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <PortalLayout
      tenantName={tenantInfo?.name || tenantSlug}
      logoUrl={tenantInfo?.logo_url}
      primaryColor={tenantInfo?.primary_color}
    >
      {children}
    </PortalLayout>
  );
}
