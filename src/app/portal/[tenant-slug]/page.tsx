"use client";
import { use } from "react";
import { PortalLogin } from "@/components/portal/PortalLogin";

export default function PortalLoginPage({
  params,
}: {
  params: Promise<{ "tenant-slug": string }>;
}) {
  const { "tenant-slug": tenantSlug } = use(params);

  return <PortalLogin tenantSlug={tenantSlug} tenantName={tenantSlug} />;
}
