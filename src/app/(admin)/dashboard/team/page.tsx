"use client";
import React from "react";
import { MembersTable } from "@/components/agency";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Members</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your team and permissions</p>
      </div>

      <MembersTable />
    </div>
  );
}
