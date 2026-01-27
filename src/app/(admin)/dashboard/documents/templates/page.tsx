"use client";
import React, { useState } from "react";
import { TemplatesTable, TemplateDetailsSidebar } from "@/components/agency";
import { UploadTemplateModal } from "@/components/agency/modals";
import { FeatureGate } from "@/components/ui/FeatureGate";
import type { TemplateRecord } from "@/components/agency/TemplatesTable";

export default function TemplatesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sidebar state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit modal state
  const [editTemplate, setEditTemplate] = useState<TemplateRecord | null>(null);

  const handleTemplateSelect = (template: TemplateRecord) => {
    setSelectedTemplate(template);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleTemplateCreated = (template: TemplateRecord) => {
    setRefreshKey((prev) => prev + 1);
    setIsModalOpen(false);
    setEditTemplate(null);
  };

  const handleEditTemplate = (template: TemplateRecord) => {
    setEditTemplate(template);
    setIsModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/templates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRefreshKey((prev) => prev + 1);
        if (selectedTemplate?.id === id) {
          setIsSidebarOpen(false);
          setSelectedTemplate(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleUseTemplate = async (template: TemplateRecord) => {
    try {
      // Track usage via API
      await fetch(`/api/documents/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use" }),
      });

      // Refresh to update counts
      setRefreshKey((prev) => prev + 1);

      // Open the template file
      window.open(template.file_url, "_blank");
    } catch (err) {
      console.error("Failed to track template usage:", err);
      // Still open the file even if tracking fails
      window.open(template.file_url, "_blank");
    }
  };

  return (
    <FeatureGate feature="document_templates">
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Templates</h1>
            <p className="text-gray-500 dark:text-gray-400">Document templates for quick creation</p>
          </div>
          <button
            onClick={() => {
              setEditTemplate(null);
              setIsModalOpen(true);
            }}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Upload Template
          </button>
        </div>

        <TemplatesTable
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
          onAddTemplate={() => {
            setEditTemplate(null);
            setIsModalOpen(true);
          }}
          refreshKey={refreshKey}
        />
      </div>

      {/* Upload/Edit Template Modal */}
      <UploadTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTemplate(null);
        }}
        onSuccess={handleTemplateCreated}
        editTemplate={editTemplate}
      />

      {/* Template Details Sidebar */}
      <TemplateDetailsSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        template={selectedTemplate}
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
        onUse={handleUseTemplate}
      />
    </>
    </FeatureGate>
  );
}
