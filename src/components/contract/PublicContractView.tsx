"use client";
import React, { useState, useEffect, useRef } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { SignaturePad } from "@/components/agency/SignaturePad";

interface PublicContract {
  id: string;
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
  is_signed: boolean;
  signatory_name: string | null;
  signed_date: string | null;
  counter_signed: boolean;
  counter_signatory_name: string | null;
  counter_signed_date: string | null;
  metadata: { signature_data?: string } | null;
  created_at: string;
  client?: {
    id: string;
    name: string;
  };
}

interface ContractSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface PublicContractViewProps {
  contract: PublicContract;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export const PublicContractView: React.FC<PublicContractViewProps> = ({
  contract,
}) => {
  const [signatureName, setSignatureName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [signed, setSigned] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState("");
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      fetch(`/api/contracts/public/${contract.slug}/view`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [contract.slug]);

  const isAlreadySigned = contract.status === "signed" || contract.status === "accepted" || contract.status === "declined";
  const isExpired = contract.status === "expired" || contract.status === "terminated";

  const handleAccept = async () => {
    if (!signatureName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!signatureData) {
      setError("Please provide your signature");
      return;
    }

    setIsSigning(true);
    setError("");

    try {
      const res = await fetch(`/api/contracts/public/${contract.slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_name: signatureName.trim(),
          signature_data: signatureData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign contract");
      }

      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this contract?")) return;

    setIsDeclining(true);
    setError("");

    try {
      const res = await fetch(`/api/contracts/public/${contract.slug}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to decline contract");
      }

      setDeclined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline contract");
    } finally {
      setIsDeclining(false);
    }
  };

  const sortedSections = [...(contract.sections || [])].sort(
    (a, b) => a.order - b.order
  );

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-gray-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
            <svg className="h-8 w-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Contract Signed
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Thank you for signing this contract. We will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-gray-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Contract Declined
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            This contract has been declined. If you change your mind, please contact us.
          </p>
        </div>
      </div>
    );
  }

  const renderCover = (section: ContractSection) => {
    let coverData: { title?: string; subtitle?: string; imageUrl?: string; contractNumber?: string } = {};
    try {
      coverData = JSON.parse(section.content || "{}");
    } catch {
      coverData = {};
    }

    return (
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-12 py-24 text-center text-white">
        {coverData.imageUrl && (
          <div
            className="absolute inset-0 rounded-2xl bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${coverData.imageUrl})` }}
          />
        )}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight">
            {coverData.title || contract.name}
          </h1>
          {coverData.subtitle && (
            <p className="mt-4 text-xl text-white/80">{coverData.subtitle}</p>
          )}
          {coverData.contractNumber && (
            <p className="mt-2 text-sm text-white/60">Contract #{coverData.contractNumber}</p>
          )}
          {contract.client && (
            <p className="mt-8 text-lg text-white/60">
              Prepared for {contract.client.name}
            </p>
          )}
          {contract.created_at && (
            <p className="mt-2 text-sm text-white/50">
              {formatDate(contract.created_at)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderParties = (section: ContractSection) => {
    let data: { parties: { name: string; company: string; role: string; email: string }[] } = { parties: [] };
    try {
      data = JSON.parse(section.content || '{"parties":[]}');
    } catch {
      data = { parties: [] };
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{section.title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.parties.map((party, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <p className="font-semibold text-gray-800 dark:text-white">{party.name}</p>
              {party.company && <p className="text-sm text-gray-500 dark:text-gray-400">{party.company}</p>}
              {party.role && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{party.role}</p>}
              {party.email && <p className="text-sm text-gray-500 dark:text-gray-400">{party.email}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeliverables = (section: ContractSection) => {
    let data: { items: { name: string; description: string; dueDate: string }[] } = { items: [] };
    try {
      data = JSON.parse(section.content || '{"items":[]}');
    } catch {
      data = { items: [] };
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{section.title}</h2>
        <div className="space-y-3">
          {data.items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                {item.dueDate && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Due: {formatDate(item.dueDate)}</span>
                )}
              </div>
              {item.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPayment = (section: ContractSection) => {
    let data: { milestones: { name: string; amount: string; dueDate: string; description: string }[] } = { milestones: [] };
    try {
      data = JSON.parse(section.content || '{"milestones":[]}');
    } catch {
      data = { milestones: [] };
    }

    const total = data.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{section.title}</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Milestone</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.milestones.map((milestone, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">{milestone.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{milestone.description || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{milestone.dueDate ? formatDate(milestone.dueDate) : "-"}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-800 dark:text-white">{formatCurrency(parseFloat(milestone.amount) || 0, contract.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.milestones.length > 0 && (
          <div className="ml-auto max-w-xs">
            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <span className="font-semibold text-gray-800 dark:text-white">Total</span>
              <span className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(total, contract.currency)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = (section: ContractSection) => {
    let data: { milestones: { name: string; date: string; description: string }[] } = { milestones: [] };
    try {
      data = JSON.parse(section.content || '{"milestones":[]}');
    } catch {
      data = { milestones: [] };
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{section.title}</h2>
        <div className="space-y-4">
          {data.milestones.map((milestone, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-brand-500" />
                {idx < data.milestones.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />}
              </div>
              <div className="pb-6">
                <p className="font-medium text-gray-800 dark:text-white">{milestone.name}</p>
                {milestone.date && <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(milestone.date)}</p>}
                {milestone.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{milestone.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTextSection = (section: ContractSection) => (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
        {section.title}
      </h2>
      <div className="whitespace-pre-wrap text-gray-600 leading-relaxed dark:text-gray-300">
        {section.content}
      </div>
    </div>
  );

  const renderSignature = (section: ContractSection) => {
    let sigConfig: { agencySigns?: boolean; clientSigns?: boolean } = {};
    try {
      sigConfig = JSON.parse(section.content || "{}");
    } catch {
      sigConfig = { agencySigns: true, clientSigns: true };
    }

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          {section.title}
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {sigConfig.agencySigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Agency Signature</p>
              <div className="h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                {contract.counter_signed ? (
                  <div className="flex h-full items-center justify-center text-sm text-success-500 font-medium">Signed</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">Pending</div>
                )}
              </div>
              {contract.counter_signatory_name && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{contract.counter_signatory_name}</p>
              )}
            </div>
          )}

          {sigConfig.clientSigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Signature</p>
              {contract.is_signed ? (
                <>
                  <div className="h-28 rounded-xl border-2 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                    {contract.metadata?.signature_data ? (
                      <img src={contract.metadata.signature_data} alt="Client signature" className="h-full w-full object-contain p-3" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-success-500 font-medium">Signed</div>
                    )}
                  </div>
                  {contract.signatory_name && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{contract.signatory_name}</p>
                  )}
                </>
              ) : !isAlreadySigned && !isExpired ? (
                <div className="space-y-4">
                  <SignaturePad onChange={(data) => setSignatureData(data)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                  <span className="text-sm text-gray-400">
                    {isExpired ? "Contract expired" : "N/A"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {!isAlreadySigned && !isExpired && (
          <div className="space-y-3">
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div className="flex items-center gap-3">
              <Button onClick={handleAccept} disabled={isSigning}>
                {isSigning ? "Signing..." : "Accept & Sign"}
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={isDeclining}>
                {isDeclining ? "Declining..." : "Decline"}
              </Button>
            </div>
          </div>
        )}

        {isAlreadySigned && (
          <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
            <Badge
              size="md"
              color={contract.status === "signed" || contract.status === "accepted" ? "success" : "error"}
            >
              {contract.status === "signed" || contract.status === "accepted"
                ? "Contract Signed"
                : "Contract Declined"}
            </Badge>
          </div>
        )}

        {isExpired && (
          <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
            <Badge size="md" color="light">
              Contract {contract.status === "terminated" ? "Terminated" : "Expired"}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: ContractSection) => {
    switch (section.type) {
      case "cover":
        return renderCover(section);
      case "parties":
        return renderParties(section);
      case "deliverables":
        return renderDeliverables(section);
      case "payment":
        return renderPayment(section);
      case "timeline":
        return renderTimeline(section);
      case "signature":
        return renderSignature(section);
      case "scope":
      case "terms":
      case "clauses":
      case "custom":
      default:
        return renderTextSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {sortedSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">This contract has no content yet.</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">The contract is still being prepared.</p>
          </div>
        ) : (
          sortedSections.map((section) => (
            <div key={section.id}>{renderSection(section)}</div>
          ))
        )}

        {/* Contract dates */}
        {(contract.start_date || contract.end_date) && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {contract.start_date && <>Effective from {formatDate(contract.start_date)}</>}
            {contract.start_date && contract.end_date && <> to </>}
            {contract.end_date && <>{!contract.start_date && "Valid until "}{formatDate(contract.end_date)}</>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicContractView;
