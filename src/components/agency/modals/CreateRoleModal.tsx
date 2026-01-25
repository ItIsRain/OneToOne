"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const permissionGroups = [
  {
    name: "Projects",
    permissions: [
      { id: "projects-view", label: "View projects" },
      { id: "projects-create", label: "Create projects" },
      { id: "projects-edit", label: "Edit projects" },
      { id: "projects-delete", label: "Delete projects" },
    ],
  },
  {
    name: "Clients",
    permissions: [
      { id: "clients-view", label: "View clients" },
      { id: "clients-create", label: "Create clients" },
      { id: "clients-edit", label: "Edit clients" },
      { id: "clients-delete", label: "Delete clients" },
    ],
  },
  {
    name: "Finance",
    permissions: [
      { id: "finance-view", label: "View financial data" },
      { id: "invoices-create", label: "Create invoices" },
      { id: "invoices-edit", label: "Edit invoices" },
      { id: "payments-record", label: "Record payments" },
    ],
  },
  {
    name: "Team",
    permissions: [
      { id: "team-view", label: "View team members" },
      { id: "team-manage", label: "Manage team" },
      { id: "roles-manage", label: "Manage roles" },
    ],
  },
  {
    name: "Reports",
    permissions: [
      { id: "reports-view", label: "View reports" },
      { id: "reports-export", label: "Export reports" },
    ],
  },
];

export function CreateRoleModal({ isOpen, onClose }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Role data:", { ...formData, permissions: selectedPermissions });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Create Role
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              placeholder="e.g., Project Manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of this role"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="mt-3 space-y-4 max-h-64 overflow-y-auto">
              {permissionGroups.map((group) => (
                <div key={group.name} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3">{group.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {permission.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
