"use client";
import React from "react";
import { ApiKeysSettings } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ApiKeysPage() {
  return (
    <FeatureGate feature="api_keys">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">API Keys</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage API keys for programmatic access</p>
        </div>

        <ApiKeysSettings />
      </div>
    </FeatureGate>
  );
}
