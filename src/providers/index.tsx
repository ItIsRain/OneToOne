"use client";

import React, { createContext, useContext } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";

interface TenantContextType {
  tenantSlug: string;
  isAgency: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantSlug: "demo",
  isAgency: false,
});

export const useTenantContext = () => useContext(TenantContext);

interface ProvidersProps {
  children: React.ReactNode;
  tenantSlug: string;
  isAgency: boolean;
}

export function Providers({ children, tenantSlug, isAgency }: ProvidersProps) {
  return (
    <TenantContext.Provider value={{ tenantSlug, isAgency }}>
      <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </TenantContext.Provider>
  );
}
