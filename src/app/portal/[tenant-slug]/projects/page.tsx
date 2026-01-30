"use client";
import { useEffect, useState } from "react";
import { PortalProjectsList } from "@/components/portal/PortalProjectsList";

export default function PortalProjectsPage() {
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPortalClientId(localStorage.getItem("portal_client_id"));
  }, []);

  if (!portalClientId) return null;
  return <PortalProjectsList portalClientId={portalClientId} />;
}
