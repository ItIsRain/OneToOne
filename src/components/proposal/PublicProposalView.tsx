"use client";
import React, { useState, useEffect, useRef } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { SignaturePad } from "@/components/agency/SignaturePad";

interface PublicProposal {
  id: string;
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
  client_signature_data: string | null;
  client_signature_name: string | null;
  agency_signature_data: string | null;
  agency_signature_name: string | null;
  created_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
}

interface ProposalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface PublicProposalViewProps {
  proposal: PublicProposal;
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const PublicProposalView: React.FC<PublicProposalViewProps> = ({
  proposal,
}) => {
  const [signatureName, setSignatureName] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [signed, setSigned] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState("");
  const viewTracked = useRef(false);

  // Track view on page load
  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      fetch(`/api/proposals/public/${proposal.slug}/view`, {
        method: "POST",
      }).catch(() => {
        // Silently fail - view tracking is not critical
      });
    }
  }, [proposal.slug]);

  const isAlreadySigned = proposal.status === "accepted" || proposal.status === "declined";
  const isExpired = proposal.status === "expired";

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
      const res = await fetch(`/api/proposals/public/${proposal.slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_name: signatureName.trim(),
          signature_data: signatureData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign proposal");
      }

      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign proposal");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this proposal?")) return;

    setIsDeclining(true);
    setError("");

    try {
      const res = await fetch(`/api/proposals/public/${proposal.slug}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to decline proposal");
      }

      setDeclined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline proposal");
    } finally {
      setIsDeclining(false);
    }
  };

  const sortedSections = [...(proposal.sections || [])].sort(
    (a, b) => a.order - b.order
  );

  // Success state
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
            Proposal Accepted
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Thank you for accepting this proposal. We will be in touch shortly.
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
            Proposal Declined
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            This proposal has been declined. If you change your mind, please contact us.
          </p>
        </div>
      </div>
    );
  }

  const renderCover = (section: ProposalSection) => {
    let coverData: { title?: string; subtitle?: string; imageUrl?: string } = {};
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
            {coverData.title || proposal.title}
          </h1>
          {coverData.subtitle && (
            <p className="mt-4 text-xl text-white/80">{coverData.subtitle}</p>
          )}
          {proposal.client && (
            <p className="mt-8 text-lg text-white/60">
              Prepared for {proposal.client.name}
              {proposal.client.company ? ` - ${proposal.client.company}` : ""}
            </p>
          )}
          {proposal.created_at && (
            <p className="mt-2 text-sm text-white/50">
              {formatDate(proposal.created_at)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderTextSection = (section: ProposalSection) => (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
        {section.title}
      </h2>
      <div className="whitespace-pre-wrap text-gray-600 leading-relaxed dark:text-gray-300">
        {section.content}
      </div>
    </div>
  );

  const renderPricing = () => {
    const items = proposal.pricing_items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const discountAmount = subtotal * ((proposal.discount_percent || 0) / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * ((proposal.tax_percent || 0) / 100);
    const total = taxableAmount + taxAmount;

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Pricing
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rate
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.rate, proposal.currency)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(item.quantity * item.rate, proposal.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatCurrency(subtotal, proposal.currency)}
            </span>
          </div>
          {proposal.discount_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Discount ({proposal.discount_percent}%)
              </span>
              <span className="text-error-500">
                -{formatCurrency(discountAmount, proposal.currency)}
              </span>
            </div>
          )}
          {proposal.tax_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Tax ({proposal.tax_percent}%)
              </span>
              <span className="text-gray-800 dark:text-white">
                {formatCurrency(taxAmount, proposal.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <span className="font-semibold text-gray-800 dark:text-white">
              Total
            </span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              {formatCurrency(total, proposal.currency)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSignature = (section: ProposalSection) => {
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
          {/* Agency Signature */}
          {sigConfig.agencySigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Agency Signature
              </p>
              <div className="h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                {proposal.agency_signature_data ? (
                  <img
                    src={proposal.agency_signature_data}
                    alt="Agency signature"
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Pending
                  </div>
                )}
              </div>
              {proposal.agency_signature_name && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {proposal.agency_signature_name}
                </p>
              )}
            </div>
          )}

          {/* Client Signature */}
          {sigConfig.clientSigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Client Signature
              </p>
              {proposal.client_signature_data ? (
                <>
                  <div className="h-28 rounded-xl border-2 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                    <img
                      src={proposal.client_signature_data}
                      alt="Client signature"
                      className="h-full w-full object-contain p-3"
                    />
                  </div>
                  {proposal.client_signature_name && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {proposal.client_signature_name}
                    </p>
                  )}
                </>
              ) : !isAlreadySigned && !isExpired ? (
                <div className="space-y-4">
                  <SignaturePad
                    onChange={(data) => setSignatureData(data)}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Full Name
                    </label>
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
                    {isExpired ? "Proposal expired" : "N/A"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accept / Decline Buttons */}
        {!isAlreadySigned && !isExpired && (
          <div className="space-y-3">
            {error && (
              <p className="text-sm text-error-500">{error}</p>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAccept}
                disabled={isSigning}
              >
                {isSigning ? "Signing..." : "Accept & Sign"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={isDeclining}
              >
                {isDeclining ? "Declining..." : "Decline"}
              </Button>
            </div>
          </div>
        )}

        {/* Already handled statuses */}
        {isAlreadySigned && (
          <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
            <Badge
              size="md"
              color={proposal.status === "accepted" ? "success" : "error"}
            >
              {proposal.status === "accepted"
                ? "Proposal Accepted"
                : "Proposal Declined"}
            </Badge>
          </div>
        )}

        {isExpired && (
          <div className="rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
            <Badge size="md" color="light">
              Proposal Expired
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: ProposalSection) => {
    switch (section.type) {
      case "cover":
        return renderCover(section);
      case "pricing":
        return renderPricing();
      case "signature":
        return renderSignature(section);
      case "introduction":
      case "scope":
      case "timeline":
      case "terms":
      case "custom":
      default:
        return renderTextSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {sortedSections.map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}

        {/* Valid Until */}
        {proposal.valid_until && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            This proposal is valid until {formatDate(proposal.valid_until)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProposalView;
