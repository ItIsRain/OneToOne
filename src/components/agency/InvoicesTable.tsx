"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { CreateInvoiceModal } from "./modals";

interface Invoice {
  id: number;
  invoiceNumber: string;
  client: string;
  event: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
  dueDate: string;
  issuedDate: string;
}

const invoicesData: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "INV-1024",
    client: "Acme Corporation",
    event: "Team Building",
    amount: "$4,500",
    status: "Paid",
    dueDate: "2025-01-30",
    issuedDate: "2025-01-15",
  },
  {
    id: 2,
    invoiceNumber: "INV-1025",
    client: "TechStart Inc.",
    event: "Product Launch",
    amount: "$12,800",
    status: "Pending",
    dueDate: "2025-02-15",
    issuedDate: "2025-01-25",
  },
  {
    id: 3,
    invoiceNumber: "INV-1026",
    client: "GlobalTech Solutions",
    event: "Tech Conference",
    amount: "$8,200",
    status: "Overdue",
    dueDate: "2025-01-20",
    issuedDate: "2025-01-05",
  },
  {
    id: 4,
    invoiceNumber: "INV-1027",
    client: "Metro Events",
    event: "Annual Gala",
    amount: "$15,000",
    status: "Draft",
    dueDate: "2025-02-28",
    issuedDate: "2025-02-01",
  },
  {
    id: 5,
    invoiceNumber: "INV-1023",
    client: "Creative Co.",
    event: "Brand Workshop",
    amount: "$3,200",
    status: "Paid",
    dueDate: "2025-01-10",
    issuedDate: "2024-12-28",
  },
];

export const InvoicesTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Invoices
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Create Invoice
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Invoice
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Client
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Event
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Due Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoicesData.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {invoice.invoiceNumber}
                  </p>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {invoice.client}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {invoice.event}
                </TableCell>
                <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {invoice.amount}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      invoice.status === "Paid"
                        ? "success"
                        : invoice.status === "Pending"
                        ? "warning"
                        : invoice.status === "Overdue"
                        ? "error"
                        : "light"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium">
                      View
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium">
                      Send
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    <CreateInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
