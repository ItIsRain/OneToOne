"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ProposalSectionEditor } from "@/components/agency/ProposalSectionEditor";
import { ProposalDetailsSidebar } from "@/components/agency/sidebars/ProposalDetailsSidebar";
import { SendProposalModal } from "@/components/agency/modals/SendProposalModal";
import type { ProposalSection } from "@/components/agency/ProposalSectionEditor";
import type { PricingItem } from "@/components/agency/ProposalPricingTable";

interface Proposal {
  id: string;
  tenant_id: string;
  client_id: string | null;
  lead_id: string | null;
  project_id: string | null;
  title: string;
  slug: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  sections: ProposalSection[];
  pricing_items: PricingItem[];
  subtotal: number;
  discount_percent: number;
  tax_percent: number;
  total: number;
  currency: string;
  valid_until: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  client_signature_data: string | null;
  client_signature_name: string | null;
  agency_signature_data: string | null;
  agency_signature_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
}

interface ProposalBuilderProps {
  proposalId: string;
}

const statusConfig: Record<
  string,
  { label: string; color: "light" | "info" | "warning" | "success" | "error" }
> = {
  draft: { label: "Draft", color: "light" },
  sent: { label: "Sent", color: "info" },
  viewed: { label: "Viewed", color: "warning" },
  accepted: { label: "Accepted", color: "success" },
  declined: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "light" },
};

const sectionTypes = [
  { type: "cover", label: "Cover Page" },
  { type: "introduction", label: "Introduction" },
  { type: "scope", label: "Scope of Work" },
  { type: "timeline", label: "Timeline" },
  { type: "pricing", label: "Pricing" },
  { type: "terms", label: "Terms & Conditions" },
  { type: "signature", label: "Signature" },
  { type: "custom", label: "Custom Section" },
];

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({
  proposalId,
}) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Warn about unsaved changes on page leave
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.proposal;
        setProposal(p);
        setTitle(p.title);
        setSections(p.sections || []);
        setPricingItems(p.pricing_items || []);
      } else {
        setError("Failed to load proposal");
      }
    } catch (err) {
      console.error("Error fetching proposal:", err);
      setError("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const subtotal = pricingItems.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );
      const discountPercent = proposal?.discount_percent || 0;
      const taxPercent = proposal?.tax_percent || 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (taxPercent / 100);
      const total = taxableAmount + taxAmount;

      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sections,
          pricing_items: pricingItems,
          subtotal,
          discount_percent: discountPercent,
          tax_percent: taxPercent,
          total,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
        setHasUnsavedChanges(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save proposal");
      }
    } catch (err) {
      console.error("Error saving proposal:", err);
      setError("Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (proposal?.slug) {
      window.open(`/proposal/${proposal.slug}`, "_blank");
    }
  };

  const handleSectionChange = (index: number, updated: ProposalSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [
      newSections[index],
      newSections[index - 1],
    ];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [
      newSections[index + 1],
      newSections[index],
    ];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
    setHasUnsavedChanges(true);
  };

  const handleAddSection = (type: string) => {
    const labelMap: Record<string, string> = {
      cover: "Cover Page",
      introduction: "Introduction",
      scope: "Scope of Work",
      timeline: "Timeline",
      pricing: "Pricing",
      terms: "Terms & Conditions",
      signature: "Signature",
      custom: "Custom Section",
    };

    const newSection: ProposalSection = {
      id: Date.now().toString(),
      type,
      title: labelMap[type] || "New Section",
      content: type === "cover" ? JSON.stringify({}) : type === "signature" ? JSON.stringify({ agencySigns: true, clientSigns: true }) : "",
      order: sections.length,
    };

    setSections([...sections, newSection]);
    setShowAddSection(false);
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-8 text-center dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
      </div>
    );
  }

  if (!proposal) return null;

  const status = statusConfig[proposal.status] || statusConfig.draft;

  return (
    <div className="flex h-full gap-0">
      {/* Main Editor */}
      <div className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasUnsavedChanges(true); }}
              placeholder="Proposal title"
              className="flex-1 bg-transparent text-xl font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90 dark:placeholder:text-white/30"
            />
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              Preview
            </Button>
            <span title={!["draft", "sent"].includes(proposal.status) ? `Cannot send: proposal is ${proposal.status}` : ""}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendModal(true)}
                disabled={!["draft", "sent"].includes(proposal.status)}
              >
                {proposal.status === "sent" ? "Resend" : "Send"}
              </Button>
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <button
              onClick={() => setShowSidebar(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Details"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Sections Editor */}
        <div className="space-y-4 p-6">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <ProposalSectionEditor
                key={section.id}
                section={section}
                onChange={(updated) => handleSectionChange(index, updated)}
                onDelete={() => handleDeleteSection(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                pricingItems={section.type === "pricing" ? pricingItems : undefined}
                onPricingChange={
                  section.type === "pricing" ? setPricingItems : undefined
                }
              />
            ))}

          {/* Add Section */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddSection(!showAddSection)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>

            {showAddSection && (
              <div className="absolute left-1/2 z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {sectionTypes.map((st) => (
                  <button
                    key={st.type}
                    onClick={() => handleAddSection(st.type)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      {showSidebar && proposal && (
        <ProposalDetailsSidebar
          proposal={proposal}
          onClose={() => setShowSidebar(false)}
          onRefresh={fetchProposal}
        />
      )}

      {/* Send Modal */}
      <SendProposalModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        proposalId={proposal.id}
        proposalSlug={proposal.slug}
        onSent={() => {
          setShowSendModal(false);
          fetchProposal();
        }}
      />
    </div>
  );
};

export default ProposalBuilder;
