"use client";
import React from "react";
import { ContactsTable } from "@/components/agency/ContactsTable";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ContactsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.CRM_VIEW}>
      <FeatureGate feature="crm">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contacts</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your business contacts</p>
          </div>

          <ContactsTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
