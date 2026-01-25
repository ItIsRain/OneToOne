"use client";
import React, { useState } from "react";
import { FolderIcon, FileIcon } from "@/icons";
import { UploadFileModal } from "@/components/agency/modals";

const files = [
  { id: 1, name: "Q4 Financial Report.pdf", type: "pdf", size: "2.4 MB", modified: "Jan 25, 2025", shared: true },
  { id: 2, name: "Brand Guidelines.pdf", type: "pdf", size: "8.1 MB", modified: "Jan 20, 2025", shared: true },
  { id: 3, name: "Project Proposal.docx", type: "doc", size: "1.2 MB", modified: "Jan 18, 2025", shared: false },
  { id: 4, name: "Event Photos.zip", type: "zip", size: "156 MB", modified: "Jan 15, 2025", shared: true },
  { id: 5, name: "Meeting Notes.docx", type: "doc", size: "245 KB", modified: "Jan 12, 2025", shared: false },
];

const folders = [
  { id: 1, name: "Contracts", files: 24, modified: "Jan 25, 2025" },
  { id: 2, name: "Templates", files: 18, modified: "Jan 20, 2025" },
  { id: 3, name: "Client Files", files: 156, modified: "Jan 18, 2025" },
  { id: 4, name: "Marketing Assets", files: 89, modified: "Jan 15, 2025" },
];

export default function DocumentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Documents</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage all your files and folders</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              New Folder
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Upload File
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-4">Folders</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {folders.map((folder) => (
              <div key={folder.id} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-500/20">
                    <FolderIcon className="w-5 h-5 text-warning-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">{folder.name}</h4>
                    <p className="text-xs text-gray-500">{folder.files} files</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Files</h3>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <FileIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white/90">{file.name}</h4>
                      <p className="text-xs text-gray-500">{file.size} • Modified {file.modified}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {file.shared && (
                      <span className="text-xs text-gray-400">Shared</span>
                    )}
                    <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <UploadFileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
