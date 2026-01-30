"use client";
import { useEffect, useState } from "react";
import { PortalDashboard } from "@/components/portal/PortalDashboard";

export default function PortalDashboardPage() {
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPortalClientId(localStorage.getItem("portal_client_id"));
  }, []);

  if (!portalClientId) return null;
  return <PortalDashboard portalClientId={portalClientId} />;
}
