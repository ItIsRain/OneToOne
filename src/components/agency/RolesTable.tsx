"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "../ui/badge/Badge";
import { CreateRoleModal } from "./modals";
import { RoleDetailsSidebar } from "./sidebars";

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  is_default: boolean;
  color: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Extended data from single fetch
  members?: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    job_title: string | null;
    status: string;
  }>;
}

// Permission groups for display
export const permissionGroups = [
  {
    name: "Projects",
    key: "projects",
    permissions: [
      { id: "projects-view", label: "View projects" },
      { id: "projects-create", label: "Create projects" },
      { id: "projects-edit", label: "Edit projects" },
      { id: "projects-delete", label: "Delete projects" },
      { id: "projects-archive", label: "Archive projects" },
    ],
  },
  {
    name: "Tasks",
    key: "tasks",
    permissions: [
      { id: "tasks-view", label: "View tasks" },
      { id: "tasks-create", label: "Create tasks" },
      { id: "tasks-edit", label: "Edit tasks" },
      { id: "tasks-delete", label: "Delete tasks" },
      { id: "tasks-assign", label: "Assign tasks" },
    ],
  },
  {
    name: "Clients",
    key: "clients",
    permissions: [
      { id: "clients-view", label: "View clients" },
      { id: "clients-create", label: "Create clients" },
      { id: "clients-edit", label: "Edit clients" },
      { id: "clients-delete", label: "Delete clients" },
    ],
  },
  {
    name: "Finance",
    key: "finance",
    permissions: [
      { id: "finance-view", label: "View financial data" },
      { id: "invoices-create", label: "Create invoices" },
      { id: "invoices-edit", label: "Edit invoices" },
      { id: "invoices-send", label: "Send invoices" },
      { id: "payments-record", label: "Record payments" },
      { id: "expenses-view", label: "View expenses" },
      { id: "expenses-approve", label: "Approve expenses" },
      { id: "budgets-manage", label: "Manage budgets" },
    ],
  },
  {
    name: "Team",
    key: "team",
    permissions: [
      { id: "team-view", label: "View team members" },
      { id: "team-invite", label: "Invite members" },
      { id: "team-edit", label: "Edit members" },
      { id: "team-remove", label: "Remove members" },
      { id: "roles-manage", label: "Manage roles" },
    ],
  },
  {
    name: "Events",
    key: "events",
    permissions: [
      { id: "events-view", label: "View events" },
      { id: "events-create", label: "Create events" },
      { id: "events-edit", label: "Edit events" },
      { id: "events-delete", label: "Delete events" },
    ],
  },
  {
    name: "Reports",
    key: "reports",
    permissions: [
      { id: "reports-view", label: "View reports" },
      { id: "reports-export", label: "Export reports" },
      { id: "reports-create", label: "Create custom reports" },
    ],
  },
  {
    name: "Settings",
    key: "settings",
    permissions: [
      { id: "settings-view", label: "View settings" },
      { id: "settings-edit", label: "Edit settings" },
      { id: "integrations-manage", label: "Manage integrations" },
    ],
  },
];

// Get all permission IDs
export const allPermissionIds = permissionGroups.flatMap(g => g.permissions.map(p => p.id));

// Get permission label by ID
export const getPermissionLabel = (permissionId: string): string => {
  for (const group of permissionGroups) {
    const perm = group.permissions.find(p => p.id === permissionId);
    if (perm) return perm.label;
  }
  return permissionId;
};

// Get permission group by permission ID
export const getPermissionGroup = (permissionId: string): string => {
  for (const group of permissionGroups) {
    if (group.permissions.some(p => p.id === permissionId)) {
      return group.name;
    }
  }
  return "Other";
};

export const RolesTable = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team/roles");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch roles");
      }

      setRoles(data.roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleViewRole = async (role: Role) => {
    try {
      const res = await fetch(`/api/team/roles/${role.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingRole(data.role);
      } else {
        setViewingRole(role);
      }
    } catch {
      setViewingRole(role);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.is_system) {
      alert("System roles cannot be deleted");
      return;
    }

    if (role?.member_count && role.member_count > 0) {
      alert(`Cannot delete this role. ${role.member_count} member(s) are assigned to it. Please reassign them first.`);
      return;
    }

    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/team/roles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete role");
      }

      setRoles(roles.filter(r => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleRoleSaved = (role: Role) => {
    if (editingRole) {
      setRoles(roles.map(r => r.id === role.id ? role : r));
    } else {
      setRoles([...roles, role]);
    }
    handleModalClose();
  };

  // Group permissions by category for display
  const groupPermissions = (permissions: string[]): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};
    permissions.forEach(perm => {
      const group = getPermissionGroup(perm);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(perm);
    });
    return grouped;
  };

  // Calculate stats
  const stats = {
    total: roles.length,
    custom: roles.filter(r => !r.is_system).length,
    totalMembers: roles.reduce((sum, r) => sum + (r.member_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchRoles}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Roles</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
            {stats.total}
          </h3>
          <p className="text-xs text-gray-400 mt-1">defined roles</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Custom Roles</p>
          <h3 className="text-2xl font-bold text-brand-500 mt-1">
            {stats.custom}
          </h3>
          <p className="text-xs text-gray-400 mt-1">user-defined</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Members Assigned</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">
            {stats.totalMembers}
          </h3>
          <p className="text-xs text-gray-400 mt-1">across all roles</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Roles & Permissions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage user roles and access levels
            </p>
          </div>

          <button
            onClick={handleAddRole}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Role
          </button>
        </div>

        {roles.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No roles yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create custom roles to manage team permissions.
            </p>
            <button
              onClick={handleAddRole}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Create Role
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => {
              const groupedPermissions = groupPermissions(role.permissions);
              const permissionCount = role.permissions.length;

              return (
                <div
                  key={role.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewRole(role)}
                            className="font-semibold text-gray-800 dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400"
                          >
                            {role.name}
                          </button>
                          {role.is_system && (
                            <Badge size="sm" color="light">System</Badge>
                          )}
                          {role.is_default && (
                            <Badge size="sm" color="primary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {role.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {role.member_count} member{role.member_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {permissionCount} permission{permissionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Permission Groups */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(groupedPermissions).slice(0, 4).map(([group, perms]) => (
                      <span
                        key={group}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      >
                        {group} ({perms.length})
                      </span>
                    ))}
                    {Object.keys(groupedPermissions).length > 4 && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        +{Object.keys(groupedPermissions).length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleViewRole(role)}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                    >
                      View
                    </button>
                    {!role.is_system && (
                      <>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={deletingId === role.id || (role.member_count > 0)}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50 text-sm font-medium"
                          title={role.member_count > 0 ? "Reassign members before deleting" : "Delete role"}
                        >
                          {deletingId === role.id ? "..." : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateRoleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleRoleSaved}
        role={editingRole}
      />

      <RoleDetailsSidebar
        isOpen={!!viewingRole}
        onClose={() => setViewingRole(null)}
        role={viewingRole}
        onEdit={(role) => {
          setViewingRole(null);
          handleEditRole(role);
        }}
        onDelete={handleDeleteRole}
      />
    </>
  );
};
