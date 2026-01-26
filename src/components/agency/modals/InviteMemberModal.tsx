"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { TeamMember } from "../MembersTable";

interface Role {
  id: string;
  name: string;
  color: string;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  member?: TeamMember | null;
}

const initialFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  department: "",
  employment_type: "full-time",
  start_date: "",
  role: "member",
  custom_role_id: "",
  manager_id: "",
  hourly_rate: 0,
  skills: [] as string[],
  timezone: "UTC",
  notes: "",
  linkedin_url: "",
  tags: [] as string[],
};

const departmentOptions = [
  { value: "", label: "Select department" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "legal", label: "Legal" },
  { value: "creative", label: "Creative" },
  { value: "technology", label: "Technology" },
  { value: "events", label: "Events" },
  { value: "executive", label: "Executive" },
  { value: "other", label: "Other" },
];

const employmentTypeOptions = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contractor", label: "Contractor" },
  { value: "intern", label: "Intern" },
  { value: "freelancer", label: "Freelancer" },
];

const systemRoleOptions = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export function InviteMemberModal({ isOpen, onClose, onSave, member }: InviteMemberModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managers, setManagers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const isEditing = !!member;

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          first_name: member.first_name || "",
          last_name: member.last_name || "",
          email: member.email || "",
          phone: member.phone || "",
          job_title: member.job_title || "",
          department: member.department || "",
          employment_type: member.employment_type || "full-time",
          start_date: member.start_date || "",
          role: member.role || "member",
          custom_role_id: member.custom_role_id || "",
          manager_id: member.manager_id || "",
          hourly_rate: member.hourly_rate || 0,
          skills: member.skills || [],
          timezone: member.timezone || "UTC",
          notes: member.notes || "",
          linkedin_url: member.linkedin_url || "",
          tags: member.tags || [],
        });
        setShowOptionalFields(true);
      } else {
        setFormData(initialFormData);
        setShowOptionalFields(false);
      }
      setError("");
      fetchRoles();
      fetchManagers();
    }
  }, [isOpen, member]);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/team/roles");
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles || []);
      }
    } catch {
      // Ignore, roles are optional
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/team/members");
      const data = await res.json();
      if (res.ok) {
        // Filter to only active members who can be managers
        setManagers((data.members || []).filter((m: TeamMember) =>
          m.status === "active" && ["owner", "admin"].includes(m.role)
        ));
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/team/members/${member.id}` : "/api/team/members";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save member");
      }

      onSave(data.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const getFullName = (m: TeamMember): string => {
    return [m.first_name, m.last_name].filter(Boolean).join(" ");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Edit Team Member" : "Invite Team Member"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditing
              ? "Update team member information"
              : "Send an invitation to join your team"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-500 text-sm dark:bg-error-500/10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                type="text"
                placeholder="Project Manager"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                {departmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="role">System Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                disabled={member?.role === "owner"}
              >
                {systemRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <select
                id="employment_type"
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                {employmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          {/* Custom Role */}
          {roles.length > 0 && (
            <div>
              <Label htmlFor="custom_role_id">Custom Role</Label>
              <select
                id="custom_role_id"
                value={formData.custom_role_id}
                onChange={(e) => setFormData({ ...formData, custom_role_id: e.target.value })}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">No custom role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
          >
            {showOptionalFields ? "Hide" : "Show"} optional fields
            <svg
              className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOptionalFields && (
            <>
              {/* Manager */}
              {managers.length > 0 && (
                <div>
                  <Label htmlFor="manager_id">Reports To</Label>
                  <select
                    id="manager_id"
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="">No manager</option>
                    {managers.filter(m => m.id !== member?.id).map((m) => (
                      <option key={m.id} value={m.id}>
                        {getFullName(m)} ({m.job_title || m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    placeholder="0"
                    min="0"
                    step={0.01}
                    value={formData.hourly_rate || ""}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label htmlFor="skills">Skills</Label>
                <div className="flex gap-2">
                  <input
                    id="skills"
                    type="text"
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-brand-800 dark:hover:text-brand-300"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Any additional notes about this team member..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
            </>
          )}

          {!isEditing && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                An invitation will be created for this team member. They&apos;ll receive instructions to complete their account setup.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
