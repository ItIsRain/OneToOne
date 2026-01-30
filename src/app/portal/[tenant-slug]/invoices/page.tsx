"use client";
import { useEffect, useState } from "react";
import { PortalInvoicesList } from "@/components/portal/PortalInvoicesList";

export default function PortalInvoicesPage() {
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPortalClientId(localStorage.getItem("portal_client_id"));
  }, []);

  if (!portalClientId) return null;
  return <PortalInvoicesList portalClientId={portalClientId} />;
}
