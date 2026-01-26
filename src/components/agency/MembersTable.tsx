"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { InviteMemberModal } from "./modals";
import { MemberDetailsSidebar } from "./sidebars";

export interface TeamMember {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  job_title: string | null;
  department: string | null;
  employment_type: "full-time" | "part-time" | "contractor" | "intern" | "freelancer";
  start_date: string | null;
  status: "active" | "inactive" | "on_leave" | "terminated" | "pending_invite";
  skills: string[] | null;
  hourly_rate: number;
  manager_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  timezone: string | null;
  working_hours: Record<string, { start: string; end: string }> | null;
  last_active_at: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  invited_by: string | null;
  notes: string | null;
  linkedin_url: string | null;
  tags: string[] | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  custom_role_id: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  manager?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  custom_role?: {
    id: string;
    name: string;
    color: string;
    permissions: string[];
  } | null;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "light" },
  on_leave: { label: "On Leave", color: "warning" },
  terminated: { label: "Terminated", color: "error" },
  pending_invite: { label: "Pending", color: "primary" },
};

const roleConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  owner: { label: "Owner", color: "error" },
  admin: { label: "Admin", color: "warning" },
  member: { label: "Member", color: "light" },
};

const departmentLabels: Record<string, string> = {
  engineering: "Engineering",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  hr: "Human Resources",
  legal: "Legal",
  creative: "Creative",
  technology: "Technology",
  events: "Events",
  executive: "Executive",
  other: "Other",
};

const employmentTypeLabels: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contractor: "Contractor",
  intern: "Intern",
  freelancer: "Freelancer",
};

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  is_system?: boolean;
  is_default?: boolean;
}

export const MembersTable = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team/members");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch members");
      }

      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/team/roles");
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles || []);
      }
    } catch {
      // Silently fail - roles are optional
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchRoles();
  }, [fetchMembers, fetchRoles]);

  const handleViewMember = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/team/members/${member.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingMember(data.member);
      } else {
        setViewingMember(member);
      }
    } catch {
      setViewingMember(member);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (id: string) => {
    const member = members.find(m => m.id === id);
    const confirmMsg = member?.status === "pending_invite"
      ? "Are you sure you want to cancel this invitation?"
      : "Are you sure you want to remove this team member?";

    if (!confirm(confirmMsg)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/team/members/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleMemberSaved = (member: TeamMember) => {
    if (editingMember) {
      setMembers(members.map(m => m.id === member.id ? member : m));
    } else {
      setMembers([member, ...members]);
    }
    handleModalClose();
  };

  const handleStatusChange = async (member: TeamMember, newStatus: string) => {
    try {
      const res = await fetch(`/api/team/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setMembers(members.map(m => m.id === member.id ? data.member : m));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleRoleChange = async (member: TeamMember, newRoleId: string | null) => {
    const newRole = newRoleId ? roles.find(r => r.id === newRoleId) : null;
    const roleName = newRole?.name || "No Role";

    try {
      const res = await fetch(`/api/team/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_role_id: newRoleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      const data = await res.json();
      setMembers(members.map(m => m.id === member.id ? data.member : m));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (member: TeamMember): string => {
    const first = member.first_name?.[0] || "";
    const last = member.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getFullName = (member: TeamMember): string => {
    return [member.first_name, member.last_name].filter(Boolean).join(" ");
  };

  // Filter members
  const filteredMembers = statusFilter === "all"
    ? members
    : members.filter(m => m.status === statusFilter);

  // Calculate stats
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === "active").length,
    pending: members.filter(m => m.status === "pending_invite").length,
    onLeave: members.filter(m => m.status === "on_leave").length,
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
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
          onClick={fetchMembers}
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
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
            {stats.total}
          </h3>
          <p className="text-xs text-gray-400 mt-1">in your team</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">
            {stats.active}
          </h3>
          <p className="text-xs text-gray-400 mt-1">working members</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Invites</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.pending > 0 ? "text-brand-500" : "text-gray-400"}`}>
            {stats.pending}
          </h3>
          <p className="text-xs text-gray-400 mt-1">awaiting acceptance</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">On Leave</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.onLeave > 0 ? "text-warning-500" : "text-gray-400"}`}>
            {stats.onLeave}
          </h3>
          <p className="text-xs text-gray-400 mt-1">currently away</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Team Members
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${statusFilter.replace("_", " ")})`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "active", label: "Active", count: stats.active },
                { key: "pending_invite", label: "Pending", count: stats.pending },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === filter.key
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter.label} {filter.count > 0 && `(${filter.count})`}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddMember}
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Invite Member
            </button>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {statusFilter === "all" ? "No team members yet" : `No ${statusFilter.replace("_", " ")} members`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "all"
                ? "Start building your team by inviting members."
                : "Try changing the filter to see other members."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={handleAddMember}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Invite Member
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Member
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Role
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Department
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Type
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMembers.map((member) => {
                  const status = statusConfig[member.status] || statusConfig.active;
                  const systemRole = roleConfig[member.role] || roleConfig.member;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={getFullName(member)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                              {getInitials(member)}
                            </div>
                          )}
                          <div>
                            <button
                              onClick={() => handleViewMember(member)}
                              className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                            >
                              {getFullName(member)}
                            </button>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {member.email}
                            </span>
                            {member.job_title && (
                              <span className="block text-brand-500 text-theme-xs">
                                {member.job_title}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="relative group">
                          {/* Owner badge - special case */}
                          {member.role === "owner" ? (
                            <Badge size="sm" color="error">
                              Owner
                            </Badge>
                          ) : member.custom_role ? (
                            <span
                              className="inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium"
                              style={{
                                backgroundColor: `${member.custom_role.color}20`,
                                color: member.custom_role.color,
                              }}
                            >
                              {member.custom_role.name}
                            </span>
                          ) : (
                            <Badge size="sm" color="light">
                              Member
                            </Badge>
                          )}
                          {/* Quick role change dropdown - not for owners */}
                          {member.role !== "owner" && member.status !== "pending_invite" && roles.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                                <p className="px-3 py-1 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">Change Role</p>
                                {/* Default Member option */}
                                <button
                                  onClick={() => handleRoleChange(member, null)}
                                  disabled={!member.custom_role_id}
                                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                    !member.custom_role_id ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                                  <span className="text-gray-600 dark:text-gray-400">Member</span>
                                  {!member.custom_role_id && (
                                    <svg className="w-3 h-3 ml-auto text-success-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                                {/* Custom roles */}
                                {roles.map((role) => (
                                  <button
                                    key={role.id}
                                    onClick={() => handleRoleChange(member, role.id)}
                                    disabled={member.custom_role_id === role.id}
                                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                      member.custom_role_id === role.id ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: role.color }}
                                    />
                                    <span style={{ color: role.color }}>{role.name}</span>
                                    {member.custom_role_id === role.id && (
                                      <svg className="w-3 h-3 ml-auto text-success-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-gray-600 text-theme-sm dark:text-gray-300 whitespace-nowrap">
                          {member.department ? departmentLabels[member.department] || member.department : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-gray-600 text-theme-sm dark:text-gray-300 whitespace-nowrap">
                          {employmentTypeLabels[member.employment_type] || member.employment_type}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {member.role !== "owner" && ["active", "inactive", "on_leave"].includes(member.status) && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                                {member.status !== "active" && (
                                  <button
                                    onClick={() => handleStatusChange(member, "active")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                  >
                                    Set Active
                                  </button>
                                )}
                                {member.status !== "on_leave" && (
                                  <button
                                    onClick={() => handleStatusChange(member, "on_leave")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-warning-500"
                                  >
                                    Set On Leave
                                  </button>
                                )}
                                {member.status !== "inactive" && (
                                  <button
                                    onClick={() => handleStatusChange(member, "inactive")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                  >
                                    Set Inactive
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                          >
                            Edit
                          </button>
                          {member.role !== "owner" && (
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              disabled={deletingId === member.id}
                              className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                            >
                              {deletingId === member.id ? "..." : member.status === "pending_invite" ? "Cancel" : "Remove"}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleMemberSaved}
        member={editingMember}
      />

      <MemberDetailsSidebar
        isOpen={!!viewingMember}
        onClose={() => setViewingMember(null)}
        member={viewingMember}
        onEdit={(member) => {
          setViewingMember(null);
          handleEditMember(member);
        }}
        onDelete={handleDeleteMember}
        onStatusChange={handleStatusChange}
        onRoleChange={(member, newRoleId) => {
          handleRoleChange(member, newRoleId);
          // Update the viewing member state as well
          if (viewingMember && viewingMember.id === member.id) {
            const newRole = newRoleId ? roles.find(r => r.id === newRoleId) : null;
            setViewingMember({
              ...viewingMember,
              custom_role_id: newRoleId,
              custom_role: newRole ? { id: newRole.id, name: newRole.name, color: newRole.color, permissions: newRole.permissions } : null,
            });
          }
        }}
        onResendInvite={async (id) => {
          const response = await fetch(`/api/team/members/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "resend_invite" }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to resend invitation");
          }
        }}
        roles={roles}
      />
    </>
  );
};
