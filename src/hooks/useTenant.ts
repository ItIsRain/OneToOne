"use client";

import { useState, useEffect } from "react";

interface Tenant {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>({
    id: "1",
    name: "Your Agency",
    primaryColor: "#6fbf00",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch tenant data from an API
    setIsLoading(false);
  }, []);

  return { tenant, isLoading, setTenant };
}
