"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  original_amount: number | null;
  currency: string;
  status: string;
  description: string;
  discount_code: string | null;
  discount_percent: number | null;
  paid_at: string | null;
  created_at: string;
  tenant_name: string;
  tenant_subdomain: string;
  plan_type: string;
  billing_interval: string;
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/settings/billing/invoices/${id}`);
        if (res.status === 401) {
          router.push("/signin");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch invoice");
        }
        const data = await res.json();
        setInvoice(data.invoice);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "The invoice you're looking for doesn't exist."}</p>
          <Link href="/dashboard/settings/billing" className="text-lime-500 hover:text-lime-600">
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  const planName = invoice.plan_type.charAt(0).toUpperCase() + invoice.plan_type.slice(1);
  const billingPeriod = invoice.billing_interval === "yearly" ? "Annual" : "Monthly";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 print:bg-white print:py-0">
      {/* Action buttons - hidden when printing */}
      <div className="max-w-3xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/settings/billing"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Billing
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto px-4 print:px-0 print:max-w-none">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg print:shadow-none print:rounded-none overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-lime-500 to-emerald-500 px-8 py-6 print:from-lime-600 print:to-emerald-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">1:1</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">One To One</h1>
                  <p className="text-white/80 text-sm">Invoice</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{invoice.invoice_number}</p>
                <p className="text-white/80 text-sm">{formatDate(invoice.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Badge */}
            <div className="flex justify-end mb-8">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                invoice.status === "paid"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : invoice.status === "pending"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>

            {/* Bill To */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{invoice.tenant_name}</p>
                <p className="text-gray-600 dark:text-gray-400">{invoice.tenant_subdomain}.1i1.ae</p>
              </div>
              <div className="md:text-right">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">From</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">One To One Inc.</p>
                <p className="text-gray-600 dark:text-gray-400">Dubai, UAE</p>
                <p className="text-gray-600 dark:text-gray-400">billing@1i1.ae</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="border dark:border-gray-700 rounded-xl overflow-hidden mb-8">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t dark:border-gray-700">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{planName} Plan - {billingPeriod} Subscription</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.description}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.original_amount && invoice.original_amount > invoice.amount ? (
                        <p className="text-gray-400 line-through text-sm">
                          {formatCurrency(Number(invoice.original_amount), invoice.currency)}
                        </p>
                      ) : null}
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(Number(invoice.original_amount || invoice.amount), invoice.currency)}
                      </p>
                    </td>
                  </tr>

                  {invoice.discount_code && invoice.discount_percent && (
                    <tr className="border-t dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                      <td className="px-6 py-4">
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Discount ({invoice.discount_code})
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          {invoice.discount_percent}% off applied
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-green-700 dark:text-green-400">
                          -{formatCurrency(Number(invoice.original_amount || 0) - Number(invoice.amount), invoice.currency)}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Total</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {formatCurrency(Number(invoice.amount), invoice.currency)}
                      </p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Info */}
            {invoice.paid_at && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Payment Received</p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Paid on {formatDate(invoice.paid_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm border-t dark:border-gray-700 pt-6">
              <p>Thank you for your business!</p>
              <p className="mt-1">Questions? Contact us at billing@1i1.ae</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
