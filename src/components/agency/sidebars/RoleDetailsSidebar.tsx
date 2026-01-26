"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Role } from "../RolesTable";
import { permissionGroups, getPermissionLabel } from "../RolesTable";

interface RoleDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onEdit: (role: Role) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const RoleDetailsSidebar: React.FC<RoleDetailsSidebarProps> = ({
  isOpen,
  onClose,
  role,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!role) return null;

  // Group permissions by category
  const groupedPermissions: Record<string, string[]> = {};
  role.permissions.forEach(perm => {
    for (const group of permissionGroups) {
      if (group.permissions.some(p => p.id === perm)) {
        if (!groupedPermissions[group.name]) groupedPermissions[group.name] = [];
        groupedPermissions[group.name].push(perm);
        break;
      }
    }
  });

  const handleDelete = async () => {
    if (role.is_system) {
      alert("System roles cannot be deleted");
      return;
    }

    if (role.member_count > 0) {
      alert(`Cannot delete this role. ${role.member_count} member(s) are assigned to it. Please reassign them first.`);
      return;
    }

    if (!confirm("Are you sure you want to delete this role?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(role.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      {!role.is_system && (
        <>
          <button
            onClick={() => onEdit(role)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Edit"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {onDelete && role.member_count === 0 && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={role.name}
      subtitle={role.description || "Custom role"}
      headerActions={headerActions}
      width="2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {role.is_system && (
              <Badge size="sm" color="light">System Role</Badge>
            )}
            {role.is_default && (
              <Badge size="sm" color="primary">Default</Badge>
            )}
            <span className="text-sm text-gray-500">
              {role.member_count} member{role.member_count !== 1 ? "s" : ""}
            </span>
          </div>
          {!role.is_system && (
            <button
              onClick={() => onEdit(role)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Edit Role
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Role Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${role.color}20` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: role.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {role.name}
            </h3>
            <p className="text-sm text-gray-500">
              {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""} granted
            </p>
          </div>
        </div>

        {/* Role Details */}
        <Section title="Details">
          <InfoRow label="Name" value={role.name} />
          <InfoRow label="Description" value={role.description || "No description"} />
          <InfoRow
            label="Color"
            value={
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: role.color }}
                />
                <span>{role.color}</span>
              </div>
            }
          />
          <InfoRow
            label="Type"
            value={role.is_system ? "System (built-in)" : "Custom"}
          />
          <InfoRow
            label="Default Role"
            value={role.is_default ? "Yes - assigned to new members" : "No"}
          />
        </Section>

        {/* Permission Summary */}
        <Section title="Permission Summary">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(groupedPermissions).map(([groupName, perms]) => (
              <div
                key={groupName}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{groupName}</span>
                <span className="text-xs font-medium text-brand-500">{perms.length}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Detailed Permissions */}
        <Section title="All Permissions">
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([groupName, perms]) => (
              <div key={groupName}>
                <h5 className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                  {groupName}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-1 text-xs rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                    >
                      {getPermissionLabel(perm)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedPermissions).length === 0 && (
              <p className="text-sm text-gray-500 italic">No permissions assigned</p>
            )}
          </div>
        </Section>

        {/* Members with this role */}
        {role.members && role.members.length > 0 && (
          <Section title={`Members (${role.member_count})`}>
            <div className="space-y-2">
              {role.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.first_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {[member.first_name, member.last_name].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                  <Badge
                    size="sm"
                    color={member.status === "active" ? "success" : "light"}
                  >
                    {member.status}
                  </Badge>
                </div>
              ))}
              {role.member_count > 10 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  And {role.member_count - 10} more member{role.member_count - 10 !== 1 ? "s" : ""}...
                </p>
              )}
            </div>
          </Section>
        )}

        {role.member_count === 0 && (
          <Section title="Members">
            <p className="text-sm text-gray-500 italic">No members assigned to this role yet</p>
          </Section>
        )}

        {/* Warning for system roles */}
        {role.is_system && (
          <div className="rounded-lg bg-warning-50 p-4 dark:bg-warning-500/10">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-warning-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-warning-800 dark:text-warning-400">
                  System Role
                </p>
                <p className="text-xs text-warning-600 dark:text-warning-500 mt-1">
                  This is a built-in system role and cannot be modified or deleted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(role.created_at)}</p>
          <p>Updated: {formatDate(role.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default RoleDetailsSidebar;
