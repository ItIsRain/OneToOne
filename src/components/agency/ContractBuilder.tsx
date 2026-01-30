"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ContractSectionEditor } from "@/components/agency/ContractSectionEditor";
import type { ContractSection } from "@/components/agency/ContractSectionEditor";
import { ContractDetailsSidebar } from "@/components/agency/sidebars/ContractDetailsSidebar";
import { SendContractModal } from "@/components/agency/modals/SendContractModal";

interface Contract {
  id: string;
  tenant_id: string;
  client_id: string | null;
  project_id: string | null;
  proposal_id: string | null;
  name: string;
  slug: string;
  status: string;
  contract_type: string;
  sections: ContractSection[];
  value: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  terms_and_conditions: string | null;
  payment_terms: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  is_signed: boolean;
  signatory_name: string | null;
  signatory_email: string | null;
  signature_ip: string | null;
  signed_date: string | null;
  counter_signed: boolean;
  counter_signatory_name: string | null;
  counter_signed_date: string | null;
  internal_notes: string | null;
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

interface ContractBuilderProps {
  contractId: string;
}

const statusConfig: Record<
  string,
  { label: string; color: "light" | "info" | "warning" | "success" | "error" }
> = {
  draft: { label: "Draft", color: "light" },
  sent: { label: "Sent", color: "info" },
  viewed: { label: "Viewed", color: "warning" },
  active: { label: "Active", color: "success" },
  signed: { label: "Signed", color: "success" },
  accepted: { label: "Accepted", color: "success" },
  declined: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "light" },
  terminated: { label: "Terminated", color: "error" },
};

const sectionTypes = [
  { type: "cover", label: "Cover Page" },
  { type: "parties", label: "Parties" },
  { type: "scope", label: "Scope of Work" },
  { type: "deliverables", label: "Deliverables" },
  { type: "payment", label: "Payment Terms" },
  { type: "timeline", label: "Timeline / Milestones" },
  { type: "terms", label: "Terms & Conditions" },
  { type: "clauses", label: "Clauses" },
  { type: "signature", label: "Signature" },
  { type: "custom", label: "Custom Section" },
];

export const ContractBuilder: React.FC<ContractBuilderProps> = ({
  contractId,
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<ContractSection[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [error, setError] = useState("");

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.contract;
        setContract(c);
        setTitle(c.name);
        setSections(c.sections || []);
      } else {
        setError("Failed to load contract");
      }
    } catch (err) {
      console.error("Error fetching contract:", err);
      setError("Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          sections,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContract(data.contract);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save contract");
      }
    } catch (err) {
      console.error("Error saving contract:", err);
      setError("Failed to save contract");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (contract?.slug) {
      window.open(`/contract/${contract.slug}`, "_blank");
    }
  };

  const handleSectionChange = (index: number, updated: ContractSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
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
  };

  const handleAddSection = (type: string) => {
    const labelMap: Record<string, string> = {
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

    const defaultContent: Record<string, string> = {
      cover: JSON.stringify({}),
      parties: JSON.stringify({ parties: [] }),
      deliverables: JSON.stringify({ items: [] }),
      payment: JSON.stringify({ milestones: [] }),
      timeline: JSON.stringify({ milestones: [] }),
      signature: JSON.stringify({ agencySigns: true, clientSigns: true }),
    };

    const newSection: ContractSection = {
      id: Date.now().toString(),
      type,
      title: labelMap[type] || "New Section",
      content: defaultContent[type] || "",
      order: sections.length,
    };

    setSections([...sections, newSection]);
    setShowAddSection(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-8 text-center dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
      </div>
    );
  }

  if (!contract) return null;

  const status = statusConfig[contract.status] || statusConfig.draft;

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contract title"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendModal(true)}
              disabled={contract.status !== "draft"}
            >
              Send
            </Button>
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
              <ContractSectionEditor
                key={section.id}
                section={section}
                onChange={(updated) => handleSectionChange(index, updated)}
                onDelete={() => handleDeleteSection(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
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
      {showSidebar && contract && (
        <ContractDetailsSidebar
          isOpen={showSidebar}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contract={contract as any}
          onClose={() => setShowSidebar(false)}
          onEdit={() => {}}
        />
      )}

      {/* Send Modal */}
      <SendContractModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        contractId={contract.id}
        contractSlug={contract.slug}
        onSent={() => {
          setShowSendModal(false);
          fetchContract();
        }}
      />
    </div>
  );
};

export default ContractBuilder;
