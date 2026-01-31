"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface TenantInfoContextType {
  tenantInfo: TenantInfo | null;
  logoUrl: string | null;
  loading: boolean;
  refreshTenantInfo: () => void;
  setLogoUrl: (url: string | null) => void;
}

const TenantInfoContext = createContext<TenantInfoContextType>({
  tenantInfo: null,
  logoUrl: null,
  loading: true,
  refreshTenantInfo: () => {},
  setLogoUrl: () => {},
});

export function TenantInfoProvider({ children }: { children: React.ReactNode }) {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantInfo = useCallback(async () => {
    // Read cached logo immediately to avoid flash
    const cached = localStorage.getItem("custom_logo_url");
    if (cached) setLogoUrlState(cached);

    try {
      const res = await fetch("/api/tenant/info");
      if (res.ok) {
        const data = await res.json();
        setTenantInfo(data);
        const url = data?.logo_url || null;
        setLogoUrlState(url);
        if (url) {
          localStorage.setItem("custom_logo_url", url);
        } else {
          localStorage.removeItem("custom_logo_url");
        }
      }
    } catch {
      // Keep cached value on error
      if (!cached) setLogoUrlState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  const setLogoUrl = useCallback((url: string | null) => {
    setLogoUrlState(url);
    if (url) {
      localStorage.setItem("custom_logo_url", url);
    } else {
      localStorage.removeItem("custom_logo_url");
    }
    // Dispatch event for any non-context consumers
    window.dispatchEvent(new CustomEvent("logo-changed", { detail: url }));
  }, []);

  return (
    <TenantInfoContext.Provider value={{ tenantInfo, logoUrl, loading, refreshTenantInfo: fetchTenantInfo, setLogoUrl }}>
      {children}
    </TenantInfoContext.Provider>
  );
}

export const useTenantInfo = () => useContext(TenantInfoContext);
