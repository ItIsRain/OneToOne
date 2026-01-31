"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { TeamMember } from "../MembersTable";

interface ExtendedTeamMember extends TeamMember {
  is_invite?: boolean;
  invite_status?: string;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
}

interface ManagedProject {
  id: string;
  name: string;
  status: string;
  project_code: string | null;
}

interface MemberWithActivity extends ExtendedTeamMember {
  recent_tasks?: RecentTask[];
  managed_projects?: ManagedProject[];
  invited_by_user?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  } | null;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface MemberDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWithActivity | null;
  onEdit: (member: TeamMember) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (member: TeamMember, newStatus: string) => void;
  onRoleChange?: (member: TeamMember, newRoleId: string | null) => void;
  onResendInvite?: (id: string) => Promise<void>;
  roles?: Role[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "light" },
  on_leave: { label: "On Leave", color: "warning" },
  terminated: { label: "Terminated", color: "error" },
  pending_invite: { label: "Pending Invite", color: "primary" },
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

const taskStatusColors: Record<string, string> = {
  pending: "text-warning-500",
  in_progress: "text-brand-500",
  completed: "text-success-500",
  blocked: "text-error-500",
};

export const MemberDetailsSidebar: React.FC<MemberDetailsSidebarProps> = ({
  isOpen,
  onClose,
  member,
  onEdit,
  onDelete,
  onStatusChange,
  onRoleChange,
  onResendInvite,
  roles = [],
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!member) return null;

  const status = statusConfig[member.status] || statusConfig.active;

  const getInitials = (): string => {
    const first = member.first_name?.[0] || "";
    const last = member.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getFullName = (): string => {
    return [member.first_name, member.last_name].filter(Boolean).join(" ");
  };

  const handleDelete = async () => {
    const confirmMsg = member.status === "pending_invite"
      ? "Are you sure you want to cancel this invitation?"
      : "Are you sure you want to remove this team member?";

    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(member.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(member)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {onDelete && member.role !== "owner" && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title={member.status === "pending_invite" ? "Cancel Invite" : "Remove"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={getFullName()}
      subtitle={member.job_title || member.email}
      headerActions={headerActions}
      width="2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {member.role === "owner" ? (
              <Badge size="sm" color="error">
                Owner
              </Badge>
            ) : member.custom_role ? (
              <span
                className="inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full font-medium"
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
          </div>
          <button
            onClick={() => onEdit(member)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Member
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={getFullName()}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xl font-bold dark:bg-brand-500/20 dark:text-brand-400">
              {getInitials()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {getFullName()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </p>
            {member.custom_role && (
              <span
                className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${member.custom_role.color}20`,
                  color: member.custom_role.color,
                }}
              >
                {member.custom_role.name}
              </span>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow label="Email" value={member.email} />
          <InfoRow label="Phone" value={member.phone || "-"} />
          {member.linkedin_url && (
            <InfoRow
              label="LinkedIn"
              value={
                <a
                  href={member.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  View Profile
                </a>
              }
            />
          )}
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <InfoRow label="Job Title" value={member.job_title || "-"} />
          <InfoRow
            label="Department"
            value={member.department ? departmentLabels[member.department] || member.department : "-"}
          />
          <InfoRow
            label="Employment Type"
            value={employmentTypeLabels[member.employment_type] || member.employment_type}
          />
          <InfoRow
            label="Role"
            value={
              <div className="flex items-center gap-2">
                {member.role === "owner" ? (
                  <Badge size="sm" color="error">
                    Owner
                  </Badge>
                ) : member.custom_role ? (
                  <span
                    className="inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full font-medium"
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
                {onRoleChange && member.role !== "owner" && member.status !== "pending_invite" && roles.length > 0 && (
                  <select
                    value={member.custom_role_id || ""}
                    onChange={(e) => {
                      const newRoleId = e.target.value || null;
                      onRoleChange(member, newRoleId);
                    }}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Member</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            }
          />
          <InfoRow label="Start Date" value={formatDate(member.start_date)} />
          {member.hourly_rate > 0 && (
            <InfoRow label="Hourly Rate" value={`${formatCurrency(member.hourly_rate)}/hr`} />
          )}
          {member.timezone && (
            <InfoRow label="Timezone" value={member.timezone} />
          )}
        </Section>

        {/* Manager */}
        {member.manager && (
          <Section title="Reports To">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                {member.manager.first_name?.[0]}{member.manager.last_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {[member.manager.first_name, member.manager.last_name].filter(Boolean).join(" ")}
                </p>
                <p className="text-xs text-gray-500">{member.manager.email}</p>
              </div>
            </div>
          </Section>
        )}

        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Status Actions */}
        {onStatusChange && member.role !== "owner" && ["active", "inactive", "on_leave"].includes(member.status) && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {member.status !== "active" && (
                <button
                  onClick={() => onStatusChange(member, "active")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Set Active
                </button>
              )}
              {member.status !== "on_leave" && (
                <button
                  onClick={() => onStatusChange(member, "on_leave")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20 transition-colors"
                >
                  Set On Leave
                </button>
              )}
              {member.status !== "inactive" && (
                <button
                  onClick={() => onStatusChange(member, "inactive")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  Set Inactive
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Recent Tasks */}
        {member.recent_tasks && member.recent_tasks.length > 0 && (
          <Section title="Recent Tasks">
            <div className="space-y-2">
              {member.recent_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium capitalize ${taskStatusColors[task.status] || "text-gray-500"}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Managed Projects */}
        {member.managed_projects && member.managed_projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-2">
              {member.managed_projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {project.name}
                    </p>
                    {project.project_code && (
                      <p className="text-xs text-brand-500">
                        {project.project_code}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">
                    {project.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Emergency Contact */}
        {(member.emergency_contact_name || member.emergency_contact_phone) && (
          <Section title="Emergency Contact">
            {member.emergency_contact_name && (
              <InfoRow label="Name" value={member.emergency_contact_name} />
            )}
            {member.emergency_contact_phone && (
              <InfoRow label="Phone" value={member.emergency_contact_phone} />
            )}
          </Section>
        )}

        {/* Notes */}
        {member.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {member.notes}
            </p>
          </Section>
        )}

        {/* Tags */}
        {member.tags && member.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {member.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Invitation Info */}
        {member.status === "pending_invite" && (
          <Section title="Invitation Details">
            {member.invited_by_user && (
              <InfoRow
                label="Invited By"
                value={[member.invited_by_user.first_name, member.invited_by_user.last_name].filter(Boolean).join(" ")}
              />
            )}
            <InfoRow label="Expires" value={formatDate(member.invite_expires_at || null)} />
            <InfoRow
              label="Status"
              value={
                new Date(member.invite_expires_at || "") < new Date()
                  ? <span className="text-error-500 font-medium">Expired</span>
                  : <span className="text-warning-500 font-medium">Pending</span>
              }
            />
            {onResendInvite && (
              <div className="mt-4">
                {resendSuccess ? (
                  <div className="flex items-center gap-2 text-success-600 dark:text-success-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Invitation resent successfully!</span>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setIsResending(true);
                      setResendSuccess(false);
                      try {
                        await onResendInvite(member.id);
                        setResendSuccess(true);
                        setTimeout(() => setResendSuccess(false), 5000);
                      } catch (error) {
                        console.error("Failed to resend invite:", error);
                      } finally {
                        setIsResending(false);
                      }
                    }}
                    disabled={isResending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Resend Invitation
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Joined: {formatDate(member.created_at)}</p>
          <p>Updated: {formatDate(member.updated_at)}</p>
          {member.last_active_at && <p>Last Active: {formatDate(member.last_active_at)}</p>}
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default MemberDetailsSidebar;
