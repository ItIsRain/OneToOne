"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import type { Role } from "../RolesTable";
import { permissionGroups, allPermissionIds } from "../RolesTable";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (role: Role) => void;
  role?: Role | null;
}

const colorOptions = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#6b7280", label: "Gray" },
];

export function CreateRoleModal({ isOpen, onClose, onSave, role }: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    is_default: false,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!role;

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          name: role.name || "",
          description: role.description || "",
          color: role.color || "#6366f1",
          is_default: role.is_default || false,
        });
        setSelectedPermissions(role.permissions || []);
      } else {
        setFormData({
          name: "",
          description: "",
          color: "#6366f1",
          is_default: false,
        });
        setSelectedPermissions([]);
      }
      setError("");
    }
  }, [isOpen, role]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleGroupToggle = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === allPermissionIds.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([...allPermissionIds]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/team/roles/${role.id}` : "/api/team/roles";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      if (onSave) {
        onSave(data.role);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Edit Role" : "Create Role"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditing
              ? "Update role details and permissions"
              : "Define a new role with specific permissions"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-500 text-sm dark:bg-error-500/10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                placeholder="e.g., Project Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700"
                  style={{ backgroundColor: formData.color }}
                />
                <select
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Brief description of this role's responsibilities"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Set as default role for new members
              </span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Permissions</Label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                {selectedPermissions.length === allPermissionIds.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {selectedPermissions.length} of {allPermissionIds.length} permissions selected
            </p>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {permissionGroups.map((group) => {
                const groupPermIds = group.permissions.map(p => p.id);
                const selectedCount = groupPermIds.filter(id => selectedPermissions.includes(id)).length;
                const allSelected = selectedCount === groupPermIds.length;
                const someSelected = selectedCount > 0 && !allSelected;

                return (
                  <div
                    key={group.key}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => handleGroupToggle(groupPermIds)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {group.name}
                        </span>
                      </label>
                      <span className="text-xs text-gray-400">
                        {selectedCount}/{groupPermIds.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-6">
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
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
