"use client";
import React from "react";

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

interface ProposalPreviewProps {
  proposal: Proposal;
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

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  proposal,
}) => {
  const sortedSections = [...(proposal.sections || [])].sort(
    (a, b) => a.order - b.order
  );

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

        {/* Totals */}
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
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          {section.title}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {sigConfig.agencySigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Agency Signature
              </p>
              <div className="h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                {proposal.agency_signature_data ? (
                  <img
                    src={proposal.agency_signature_data}
                    alt="Agency signature"
                    className="h-full w-full object-contain p-2"
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
          {sigConfig.clientSigns !== false && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Client Signature
              </p>
              <div className="h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
                {proposal.client_signature_data ? (
                  <img
                    src={proposal.client_signature_data}
                    alt="Client signature"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Pending
                  </div>
                )}
              </div>
              {proposal.client_signature_name && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {proposal.client_signature_name}
                </p>
              )}
            </div>
          )}
        </div>
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
    <div className="mx-auto max-w-4xl space-y-10 py-8">
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
  );
};

export default ProposalPreview;
