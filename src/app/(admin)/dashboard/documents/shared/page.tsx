"use client";
import React, { useState } from "react";
import { FileIcon } from "@/icons";
import { ShareFileModal } from "@/components/agency/modals";

const sharedFiles = [
  { id: 1, name: "Project Brief - Website Redesign.pdf", sharedWith: ["Acme Corp"], sharedBy: "Alex Johnson", date: "Jan 25, 2025" },
  { id: 2, name: "Event Schedule - Annual Gala.xlsx", sharedWith: ["Metro Events", "Venue Team"], sharedBy: "Lisa Thompson", date: "Jan 23, 2025" },
  { id: 3, name: "Brand Assets.zip", sharedWith: ["TechStart", "Creative Team"], sharedBy: "Sarah Williams", date: "Jan 20, 2025" },
  { id: 4, name: "Q1 Report Preview.pdf", sharedWith: ["GlobalTech Solutions"], sharedBy: "Michael Chen", date: "Jan 18, 2025" },
  { id: 5, name: "Meeting Recording.mp4", sharedWith: ["Internal Team"], sharedBy: "James Wilson", date: "Jan 15, 2025" },
];

export default function SharedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Shared Files</h1>
          <p className="text-gray-500 dark:text-gray-400">Files shared with clients and team members</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Share File
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sharedFiles.map((file) => (
            <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FileIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-white/90">{file.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Shared with: {file.sharedWith.join(", ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    By {file.sharedBy} • {file.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">Manage</button>
                  <button className="text-error-500 hover:text-error-600 text-sm font-medium">Revoke</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ShareFileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
