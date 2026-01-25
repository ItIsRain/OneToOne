"use client";
import React, { useState } from "react";
import { CreateRoleModal } from "@/components/agency/modals";

const roles = [
  { id: 1, name: "Admin", description: "Full access to all features", members: 2, permissions: ["All permissions"] },
  { id: 2, name: "Manager", description: "Manage projects, team, and clients", members: 4, permissions: ["View all", "Edit projects", "Manage team", "View reports"] },
  { id: 3, name: "Team Member", description: "Access to assigned projects and tasks", members: 8, permissions: ["View assigned", "Edit tasks", "View calendar"] },
  { id: 4, name: "Client", description: "Limited access to shared content", members: 12, permissions: ["View shared", "Comment", "Download files"] },
  { id: 5, name: "Accountant", description: "Access to financial modules", members: 2, permissions: ["View finance", "Edit invoices", "View reports"] },
];

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Roles & Permissions</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage user roles and access levels</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Create Role
          </button>
        </div>

        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                <span className="text-sm text-gray-500">{role.members} members</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {permission}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">Edit</button>
                <button className="text-error-500 hover:text-error-600 text-sm font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateRoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
