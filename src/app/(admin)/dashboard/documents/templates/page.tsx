"use client";
import React, { useState } from "react";
import { FileIcon } from "@/icons";
import { UploadTemplateModal } from "@/components/agency/modals";

const templates = [
  { id: 1, name: "Service Agreement Template", category: "Contracts", downloads: 45, lastUpdated: "Jan 20, 2025" },
  { id: 2, name: "Project Proposal Template", category: "Proposals", downloads: 32, lastUpdated: "Jan 18, 2025" },
  { id: 3, name: "Invoice Template", category: "Finance", downloads: 89, lastUpdated: "Jan 15, 2025" },
  { id: 4, name: "Event Brief Template", category: "Events", downloads: 28, lastUpdated: "Jan 12, 2025" },
  { id: 5, name: "Meeting Agenda Template", category: "General", downloads: 56, lastUpdated: "Jan 10, 2025" },
  { id: 6, name: "NDA Template", category: "Contracts", downloads: 23, lastUpdated: "Jan 8, 2025" },
];

const categories = ["All", "Contracts", "Proposals", "Finance", "Events", "General"];

export default function TemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Templates</h1>
            <p className="text-gray-500 dark:text-gray-400">Document templates for quick creation</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Upload Template
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
                  <FileIcon className="w-6 h-6 text-brand-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.category}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">{template.downloads} downloads</span>
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Use Template</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UploadTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
