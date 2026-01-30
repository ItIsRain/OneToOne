"use client";
import { use, useEffect, useState } from "react";
import { PortalProjectDetail } from "@/components/portal/PortalProjectDetail";

export default function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPortalClientId(localStorage.getItem("portal_client_id"));
  }, []);

  if (!portalClientId) return null;
  return <PortalProjectDetail projectId={id} portalClientId={portalClientId} />;
}
