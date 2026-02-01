"use client";

import { useState, useEffect, use } from "react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
  amount: number;
  discount_type: string;
  discount_value: number;
  tax_rate: number;
  sort_order: number;
  notes: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  title: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total: number;
  amount: number;
  amount_paid: number;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  sent_date: string | null;
  paid_at: string | null;
  payment_terms: string;
  notes: string | null;
  terms_and_conditions: string | null;
  footer_note: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_country: string | null;
  po_number: string | null;
  reference_number: string | null;
  client?: { id: string; name: string; email: string | null; company: string | null } | null;
  project?: { id: string; name: string; project_code: string | null } | null;
  items?: InvoiceItem[];
}

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}/public`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Invoice not found");
        }
        const data = await res.json();
        setInvoice(data.invoice);
        setTenantName(data.tenant?.name || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => window.print();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400">{error || "The invoice you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    viewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    partially_paid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const total = invoice.total || invoice.amount || 0;
  const balanceDue = total - (invoice.amount_paid || 0);
  const items = invoice.items?.sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 print:bg-white print:py-0">
      {/* Action bar */}
      <div className="max-w-3xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="max-w-3xl mx-auto px-4 print:px-0 print:max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg print:shadow-none print:rounded-none overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white font-bold text-xl">{tenantName || "Invoice"}</h1>
                <p className="text-white/80 text-sm">Invoice</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{invoice.invoice_number}</p>
                <p className="text-white/80 text-sm">{formatDate(invoice.issue_date)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status + title */}
            <div className="flex items-start justify-between mb-8">
              <div>
                {invoice.title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{invoice.title}</h2>
                )}
                {invoice.project && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Project: {invoice.project.name}
                    {invoice.project.project_code && ` (${invoice.project.project_code})`}
                  </p>
                )}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[invoice.status] || statusColors.draft}`}>
                {invoice.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>

            {/* Bill To / Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {invoice.client?.name || invoice.billing_name || "-"}
                </p>
                {invoice.client?.company && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.client.company}</p>
                )}
                {invoice.billing_email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.billing_email}</p>
                )}
                {invoice.billing_address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.billing_address}</p>
                )}
                {invoice.billing_city && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {invoice.billing_city}{invoice.billing_country ? `, ${invoice.billing_country}` : ""}
                  </p>
                )}
              </div>
              <div className="md:text-right">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Details</h3>
                <div className="space-y-1 text-sm">
                  {invoice.due_date && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">Due:</span> {formatDate(invoice.due_date)}
                    </p>
                  )}
                  {invoice.payment_terms && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">Terms:</span>{" "}
                      {invoice.payment_terms.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  )}
                  {invoice.po_number && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">PO:</span> {invoice.po_number}
                    </p>
                  )}
                  {invoice.reference_number && (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">Ref:</span> {invoice.reference_number}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            {items.length > 0 && (
              <div className="border dark:border-gray-700 rounded-xl overflow-hidden mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rate</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                          {item.quantity} {item.unit && item.unit !== "unit" ? item.unit : ""}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.amount || item.quantity * item.unit_price, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatCurrency(invoice.subtotal || total, invoice.currency)}
                    </span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Tax ({invoice.tax_rate}%)</span>
                      <span>{formatCurrency(invoice.tax_amount || 0, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Discount</span>
                      <span className="text-red-500">-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t dark:border-gray-700 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white text-base">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">
                      {formatCurrency(total, invoice.currency)}
                    </span>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Paid</span>
                        <span>-{formatCurrency(invoice.amount_paid, invoice.currency)}</span>
                      </div>
                      <div className="border-t dark:border-gray-700 pt-2 flex justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">Balance Due</span>
                        <span className={`font-bold ${balanceDue > 0 ? "text-orange-500" : "text-green-500"}`}>
                          {formatCurrency(balanceDue, invoice.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment received notice */}
            {invoice.status === "paid" && invoice.paid_at && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Payment Received</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Paid on {formatDate(invoice.paid_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms_and_conditions && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 whitespace-pre-wrap">{invoice.terms_and_conditions}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-400 text-xs border-t dark:border-gray-700 pt-6">
              {invoice.footer_note ? (
                <p>{invoice.footer_note}</p>
              ) : (
                <p>Thank you for your business!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
