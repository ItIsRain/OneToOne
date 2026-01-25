"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { AddTeamMemberModal } from "@/components/agency/modals";

const teamMembers = [
  { id: 1, name: "Alex Johnson", email: "alex@company.com", role: "Project Manager", department: "Operations", status: "Active", avatar: "AJ" },
  { id: 2, name: "Sarah Williams", email: "sarah@company.com", role: "Senior Designer", department: "Creative", status: "Active", avatar: "SW" },
  { id: 3, name: "Michael Chen", email: "michael@company.com", role: "Developer", department: "Technology", status: "Active", avatar: "MC" },
  { id: 4, name: "Emily Davis", email: "emily@company.com", role: "Account Manager", department: "Sales", status: "On Leave", avatar: "ED" },
  { id: 5, name: "James Wilson", email: "james@company.com", role: "Marketing Specialist", department: "Marketing", status: "Active", avatar: "JW" },
  { id: 6, name: "Lisa Thompson", email: "lisa@company.com", role: "Event Coordinator", department: "Events", status: "Active", avatar: "LT" },
];

export default function TeamPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Members</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your team and permissions</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Member
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{member.name}</h3>
                    <Badge size="sm" color={member.status === "Active" ? "success" : "warning"}>
                      {member.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{member.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{member.department}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTeamMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
