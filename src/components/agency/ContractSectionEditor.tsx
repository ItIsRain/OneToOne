"use client";
import React, { useState, useRef } from "react";

export interface ContractSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ContractSectionEditorProps {
  section: ContractSection;
  onChange: (section: ContractSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const sectionTypeIcons: Record<string, React.ReactNode> = {
  cover: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  parties: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  scope: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  deliverables: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  payment: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  timeline: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  terms: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clauses: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  signature: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  custom: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
};

const sectionTypeLabels: Record<string, string> = {
  cover: "Cover Page",
  parties: "Parties",
  scope: "Scope of Work",
  deliverables: "Deliverables",
  payment: "Payment Terms",
  timeline: "Timeline / Milestones",
  terms: "Terms & Conditions",
  clauses: "Clauses",
  signature: "Signature",
  custom: "Custom Section",
};

const CoverImageUploader: React.FC<{
  imageUrl: string;
  onImageChange: (url: string) => void;
}> = ({ imageUrl, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10MB");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onImageChange(data.url);
      } else {
        setUploadError("Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onImageChange("");
  };

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={imageUrl}
            alt="Cover"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg bg-error-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-error-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploadError && (
          <p className="text-xs text-error-500">{uploadError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Cover Image
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {uploadError && (
        <p className="text-xs text-error-500">{uploadError}</p>
      )}
    </div>
  );
};

export const ContractSectionEditor: React.FC<ContractSectionEditorProps> = ({
  section,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const icon = sectionTypeIcons[section.type] || sectionTypeIcons.custom;
  const typeLabel = sectionTypeLabels[section.type] || section.type;

  const handleContentChange = (content: string) => {
    onChange({ ...section, content });
  };

  const handleTitleChange = (title: string) => {
    onChange({ ...section, title });
  };

  const renderCoverEditor = () => {
    let coverData: { title?: string; subtitle?: string; imageUrl?: string; contractNumber?: string } = {};
    try {
      coverData = JSON.parse(section.content || "{}");
    } catch {
      coverData = {};
    }

    const updateCover = (field: string, value: string) => {
      const updated = { ...coverData, [field]: value };
      handleContentChange(JSON.stringify(updated));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cover Title
          </label>
          <input
            type="text"
            placeholder="Contract title"
            value={coverData.title || ""}
            onChange={(e) => updateCover("title", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subtitle
          </label>
          <input
            type="text"
            placeholder="Subtitle or tagline"
            value={coverData.subtitle || ""}
            onChange={(e) => updateCover("subtitle", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contract Number
          </label>
          <input
            type="text"
            placeholder="e.g. CTR-2026-001"
            value={coverData.contractNumber || ""}
            onChange={(e) => updateCover("contractNumber", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cover Image
          </label>
          <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
            Recommended: 1200 x 400px (3:1 ratio)
          </p>
          <CoverImageUploader
            imageUrl={coverData.imageUrl || ""}
            onImageChange={(url) => updateCover("imageUrl", url)}
          />
        </div>
      </div>
    );
  };

  const renderPartiesEditor = () => {
    let partiesData: { parties: { name: string; company: string; role: string; email: string }[] } = { parties: [] };
    try {
      partiesData = JSON.parse(section.content || '{"parties":[]}');
    } catch {
      partiesData = { parties: [] };
    }

    const addParty = () => {
      const updated = { ...partiesData, parties: [...partiesData.parties, { name: "", company: "", role: "", email: "" }] };
      handleContentChange(JSON.stringify(updated));
    };

    const updateParty = (index: number, field: string, value: string) => {
      const updatedParties = [...partiesData.parties];
      updatedParties[index] = { ...updatedParties[index], [field]: value };
      handleContentChange(JSON.stringify({ ...partiesData, parties: updatedParties }));
    };

    const removeParty = (index: number) => {
      const updatedParties = partiesData.parties.filter((_, i) => i !== index);
      handleContentChange(JSON.stringify({ ...partiesData, parties: updatedParties }));
    };

    return (
      <div className="space-y-4">
        {partiesData.parties.map((party, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Party {idx + 1}</span>
              <button onClick={() => removeParty(idx)} className="text-sm text-error-500 hover:text-error-600">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Name" value={party.name} onChange={(e) => updateParty(idx, "name", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="text" placeholder="Company" value={party.company} onChange={(e) => updateParty(idx, "company", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="text" placeholder="Role" value={party.role} onChange={(e) => updateParty(idx, "role", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="email" placeholder="Email" value={party.email} onChange={(e) => updateParty(idx, "email", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
            </div>
          </div>
        ))}
        <button onClick={addParty} className="text-sm font-medium text-brand-500 hover:text-brand-600">+ Add Party</button>
      </div>
    );
  };

  const renderDeliverablesEditor = () => {
    let data: { items: { name: string; description: string; dueDate: string }[] } = { items: [] };
    try {
      data = JSON.parse(section.content || '{"items":[]}');
    } catch {
      data = { items: [] };
    }

    const addItem = () => {
      const updated = { ...data, items: [...data.items, { name: "", description: "", dueDate: "" }] };
      handleContentChange(JSON.stringify(updated));
    };

    const updateItem = (index: number, field: string, value: string) => {
      const updatedItems = [...data.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      handleContentChange(JSON.stringify({ ...data, items: updatedItems }));
    };

    const removeItem = (index: number) => {
      const updatedItems = data.items.filter((_, i) => i !== index);
      handleContentChange(JSON.stringify({ ...data, items: updatedItems }));
    };

    return (
      <div className="space-y-4">
        {data.items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Deliverable {idx + 1}</span>
              <button onClick={() => removeItem(idx)} className="text-sm text-error-500 hover:text-error-600">Remove</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Deliverable name" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <textarea placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="date" value={item.dueDate} onChange={(e) => updateItem(idx, "dueDate", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
            </div>
          </div>
        ))}
        <button onClick={addItem} className="text-sm font-medium text-brand-500 hover:text-brand-600">+ Add Deliverable</button>
      </div>
    );
  };

  const renderPaymentEditor = () => {
    let data: { milestones: { name: string; amount: string; dueDate: string; description: string }[] } = { milestones: [] };
    try {
      data = JSON.parse(section.content || '{"milestones":[]}');
    } catch {
      data = { milestones: [] };
    }

    const addMilestone = () => {
      const updated = { ...data, milestones: [...data.milestones, { name: "", amount: "", dueDate: "", description: "" }] };
      handleContentChange(JSON.stringify(updated));
    };

    const updateMilestone = (index: number, field: string, value: string) => {
      const updatedMilestones = [...data.milestones];
      updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
      handleContentChange(JSON.stringify({ ...data, milestones: updatedMilestones }));
    };

    const removeMilestone = (index: number) => {
      const updatedMilestones = data.milestones.filter((_, i) => i !== index);
      handleContentChange(JSON.stringify({ ...data, milestones: updatedMilestones }));
    };

    const total = data.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

    return (
      <div className="space-y-4">
        {data.milestones.map((milestone, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment {idx + 1}</span>
              <button onClick={() => removeMilestone(idx)} className="text-sm text-error-500 hover:text-error-600">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Milestone name" value={milestone.name} onChange={(e) => updateMilestone(idx, "name", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="number" placeholder="Amount" value={milestone.amount} onChange={(e) => updateMilestone(idx, "amount", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="date" value={milestone.dueDate} onChange={(e) => updateMilestone(idx, "dueDate", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="text" placeholder="Description" value={milestone.description} onChange={(e) => updateMilestone(idx, "description", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button onClick={addMilestone} className="text-sm font-medium text-brand-500 hover:text-brand-600">+ Add Payment Milestone</button>
          {data.milestones.length > 0 && (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total: ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineEditor = () => {
    let data: { milestones: { name: string; date: string; description: string }[] } = { milestones: [] };
    try {
      data = JSON.parse(section.content || '{"milestones":[]}');
    } catch {
      data = { milestones: [] };
    }

    const addMilestone = () => {
      const updated = { ...data, milestones: [...data.milestones, { name: "", date: "", description: "" }] };
      handleContentChange(JSON.stringify(updated));
    };

    const updateMilestone = (index: number, field: string, value: string) => {
      const updatedMilestones = [...data.milestones];
      updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
      handleContentChange(JSON.stringify({ ...data, milestones: updatedMilestones }));
    };

    const removeMilestone = (index: number) => {
      const updatedMilestones = data.milestones.filter((_, i) => i !== index);
      handleContentChange(JSON.stringify({ ...data, milestones: updatedMilestones }));
    };

    return (
      <div className="space-y-4">
        {data.milestones.map((milestone, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Milestone {idx + 1}</span>
              <button onClick={() => removeMilestone(idx)} className="text-sm text-error-500 hover:text-error-600">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Milestone name" value={milestone.name} onChange={(e) => updateMilestone(idx, "name", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
              <input type="date" value={milestone.date} onChange={(e) => updateMilestone(idx, "date", e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
            </div>
            <textarea placeholder="Description" value={milestone.description} onChange={(e) => updateMilestone(idx, "description", e.target.value)} rows={2} className="mt-3 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-hidden" />
          </div>
        ))}
        <button onClick={addMilestone} className="text-sm font-medium text-brand-500 hover:text-brand-600">+ Add Milestone</button>
      </div>
    );
  };

  const renderTextEditor = () => (
    <textarea
      placeholder={`Enter ${typeLabel.toLowerCase()} content...`}
      value={section.content}
      onChange={(e) => handleContentChange(e.target.value)}
      rows={6}
      className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
    />
  );

  const renderSignatureEditor = () => {
    let sigConfig: { agencySigns?: boolean; clientSigns?: boolean } = {};
    try {
      sigConfig = JSON.parse(section.content || "{}");
    } catch {
      sigConfig = { agencySigns: true, clientSigns: true };
    }

    const updateSigConfig = (field: string, value: boolean) => {
      const updated = { ...sigConfig, [field]: value };
      handleContentChange(JSON.stringify(updated));
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure who needs to sign this contract.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={sigConfig.agencySigns !== false}
            onChange={(e) => updateSigConfig("agencySigns", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Agency signature required
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={sigConfig.clientSigns !== false}
            onChange={(e) => updateSigConfig("clientSigns", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Client signature required
          </span>
        </label>
      </div>
    );
  };

  const renderContent = () => {
    switch (section.type) {
      case "cover":
        return renderCoverEditor();
      case "parties":
        return renderPartiesEditor();
      case "deliverables":
        return renderDeliverablesEditor();
      case "payment":
        return renderPaymentEditor();
      case "timeline":
        return renderTimelineEditor();
      case "signature":
        return renderSignatureEditor();
      case "scope":
      case "terms":
      case "clauses":
      case "custom":
      default:
        return renderTextEditor();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {typeLabel}
        </span>
        <input
          type="text"
          value={section.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Section title"
          className="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90 dark:placeholder:text-white/30"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            title="Move up"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            title="Move down"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
            title="Delete section"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-4">{renderContent()}</div>
    </div>
  );
};

export default ContractSectionEditor;
