"use client";
import React, { useState, useCallback } from "react";
import { UploadFileModal } from "@/components/agency/modals";
import { CreateFolderModal } from "@/components/agency/modals/CreateFolderModal";
import { FilesTable, FileRecord } from "@/components/agency/FilesTable";
import { FileDetailsSidebar } from "@/components/agency/sidebars/FileDetailsSidebar";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Track current folder for smarter upload modal
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: FileRecord) => {
    setSelectedFile(file);
    setSidebarOpen(true);
  }, []);

  const handleFolderChange = useCallback((folderId: string | null, folderName: string | null) => {
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleFolderCreate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleFileUpdate = useCallback((updatedFile: FileRecord) => {
    setSelectedFile(updatedFile);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <ProtectedPage permission={PERMISSIONS.DOCUMENTS_VIEW}>
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Documents
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage all your files and folders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                New Folder
              </span>
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload Files
              </span>
            </button>
          </div>
        </div>

        {/* Files Table */}
        <FilesTable
          key={refreshKey}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onFolderChange={handleFolderChange}
        />
      </div>

      {/* Upload File Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        currentFolderId={currentFolderId}
        currentFolderName={currentFolderName}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleFolderCreate}
        parentFolderId={currentFolderId}
      />

      {/* File Details Sidebar */}
      <FileDetailsSidebar
        file={selectedFile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onUpdate={handleFileUpdate}
      />
    </>
    </ProtectedPage>
  );
}
