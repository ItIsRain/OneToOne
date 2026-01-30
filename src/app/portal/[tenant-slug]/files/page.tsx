"use client";
import { useEffect, useState } from "react";
import { PortalFilesList } from "@/components/portal/PortalFilesList";

export default function PortalFilesPage() {
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPortalClientId(localStorage.getItem("portal_client_id"));
  }, []);

  if (!portalClientId) return null;
  return <PortalFilesList portalClientId={portalClientId} />;
}
