"use client";
import React from "react";
import { RolesTable } from "@/components/agency";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Roles & Permissions</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage user roles and access levels</p>
      </div>

      <RolesTable />
    </div>
  );
}
