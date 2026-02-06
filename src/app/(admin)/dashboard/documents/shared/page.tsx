"use client";
import React, { useState } from "react";
import { SharedFilesTable, ShareDetailsSidebar } from "@/components/agency";
import { ShareFileModal } from "@/components/agency/modals";
import type { FileShareRecord } from "@/components/agency/SharedFilesTable";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function SharedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sidebar state
  const [selectedShare, setSelectedShare] = useState<FileShareRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleShareSelect = (share: FileShareRecord) => {
    setSelectedShare(share);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleShareCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setIsModalOpen(false);
  };

  const handleRevokeShare = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });

      if (res.ok) {
        const { share: updatedShare } = await res.json();
        setRefreshKey((prev) => prev + 1);
        if (selectedShare?.id === id) {
          setSelectedShare(updatedShare);
        }
      }
    } catch (err) {
      console.error("Failed to revoke share:", err);
    }
  };

  const handleReactivateShare = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      if (res.ok) {
        const { share: updatedShare } = await res.json();
        setRefreshKey((prev) => prev + 1);
        if (selectedShare?.id === id) {
          setSelectedShare(updatedShare);
        }
      }
    } catch (err) {
      console.error("Failed to reactivate share:", err);
    }
  };

  const handleDeleteShare = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/shares/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRefreshKey((prev) => prev + 1);
        if (selectedShare?.id === id) {
          setIsSidebarOpen(false);
          setSelectedShare(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete share:", err);
    }
  };

  return (
    <ProtectedPage permission={PERMISSIONS.DOCUMENTS_VIEW}>
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

        <SharedFilesTable
          onShareSelect={handleShareSelect}
          selectedShare={selectedShare}
          onAddShare={() => setIsModalOpen(true)}
          refreshKey={refreshKey}
        />
      </div>

      {/* Share File Modal */}
      <ShareFileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleShareCreated}
      />

      {/* Share Details Sidebar */}
      <ShareDetailsSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        share={selectedShare}
        onRevoke={handleRevokeShare}
        onReactivate={handleReactivateShare}
        onDelete={handleDeleteShare}
      />
    </ProtectedPage>
  );
}
