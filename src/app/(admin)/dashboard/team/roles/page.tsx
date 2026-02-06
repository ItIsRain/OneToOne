"use client";
import React from "react";
import { RolesTable } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function RolesPage() {
  return (
    <ProtectedPage
      permission={PERMISSIONS.ROLES_MANAGE}
      deniedMessage="You don't have permission to manage roles and permissions. Please contact your administrator."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Roles & Permissions</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage user roles and access levels</p>
        </div>

        <RolesTable />
      </div>
    </ProtectedPage>
  );
}
