"use client";
import React from "react";
import { ProposalPricingTable } from "@/components/agency/ProposalPricingTable";
import type { PricingItem } from "@/components/agency/ProposalPricingTable";

export interface ProposalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface ProposalSectionEditorProps {
  section: ProposalSection;
  onChange: (section: ProposalSection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  pricingItems?: PricingItem[];
  onPricingChange?: (items: PricingItem[]) => void;
}

const sectionTypeIcons: Record<string, React.ReactNode> = {
  cover: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  introduction: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  scope: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  timeline: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pricing: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  terms: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  introduction: "Introduction",
  scope: "Scope of Work",
  timeline: "Timeline",
  pricing: "Pricing",
  terms: "Terms & Conditions",
  signature: "Signature",
  custom: "Custom Section",
};

export const ProposalSectionEditor: React.FC<ProposalSectionEditorProps> = ({
  section,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  pricingItems,
  onPricingChange,
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
    let coverData: { title?: string; subtitle?: string; imageUrl?: string } = {};
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
            placeholder="Proposal title"
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
            Cover Image URL
          </label>
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={coverData.imageUrl || ""}
            onChange={(e) => updateCover("imageUrl", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          />
        </div>
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

  const renderPricingEditor = () => {
    if (!pricingItems || !onPricingChange) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pricing items are managed at the proposal level.
        </p>
      );
    }

    const subtotal = pricingItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );

    let pricingConfig: { discountPercent?: number; taxPercent?: number } = {};
    try {
      pricingConfig = JSON.parse(section.content || "{}");
    } catch {
      pricingConfig = {};
    }

    return (
      <ProposalPricingTable
        items={pricingItems}
        onChange={onPricingChange}
        subtotal={subtotal}
        discountPercent={pricingConfig.discountPercent || 0}
        taxPercent={pricingConfig.taxPercent || 0}
        onDiscountChange={(v) =>
          handleContentChange(JSON.stringify({ ...pricingConfig, discountPercent: v }))
        }
        onTaxChange={(v) =>
          handleContentChange(JSON.stringify({ ...pricingConfig, taxPercent: v }))
        }
      />
    );
  };

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
          Configure who needs to sign this proposal.
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
      case "pricing":
        return renderPricingEditor();
      case "signature":
        return renderSignatureEditor();
      case "introduction":
      case "scope":
      case "timeline":
      case "terms":
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

export default ProposalSectionEditor;
