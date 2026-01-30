"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface PortalInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  due_date: string | null;
  issued_date: string | null;
}

interface PortalInvoicesListProps {
  portalClientId: string;
}

const statusBadgeColor = (
  status: PortalInvoice["status"]
): "success" | "warning" | "error" | "light" => {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "overdue":
      return "error";
    case "draft":
      return "light";
  }
};

export const PortalInvoicesList: React.FC<PortalInvoicesListProps> = ({
  portalClientId,
}) => {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/portal/invoices", {
          headers: { "x-portal-client-id": portalClientId },
        });
        if (!res.ok) throw new Error("Failed to load invoices");
        const json = await res.json();
        setInvoices(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [portalClientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Invoices
      </h1>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Invoice #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Due Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Issued Date
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
                      {formatAmount(invoice.amount)}
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <Badge
                        color={statusBadgeColor(invoice.status)}
                        size="sm"
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(invoice.due_date)}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(invoice.issued_date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
