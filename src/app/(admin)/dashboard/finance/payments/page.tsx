"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordPaymentModal } from "@/components/agency/modals";

const payments = [
  { id: 1, client: "Acme Corporation", invoice: "INV-1024", amount: "$4,500", method: "Bank Transfer", date: "Jan 25, 2025", status: "Completed" },
  { id: 2, client: "TechStart Inc.", invoice: "INV-1025", amount: "$12,800", method: "Credit Card", date: "Jan 23, 2025", status: "Completed" },
  { id: 3, client: "GlobalTech Solutions", invoice: "INV-1026", amount: "$8,200", method: "Bank Transfer", date: "Jan 20, 2025", status: "Pending" },
  { id: 4, client: "Metro Events", invoice: "INV-1027", amount: "$15,000", method: "Credit Card", date: "Jan 18, 2025", status: "Completed" },
  { id: 5, client: "Creative Co.", invoice: "INV-1023", amount: "$3,200", method: "PayPal", date: "Jan 15, 2025", status: "Failed" },
];

export default function PaymentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Payments</h1>
            <p className="text-gray-500 dark:text-gray-400">Track incoming and outgoing payments</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Record Payment
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Client</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Invoice</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Amount</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Method</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Date</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{payment.client}</TableCell>
                  <TableCell className="py-4 px-6 text-brand-500">{payment.invoice}</TableCell>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{payment.amount}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{payment.method}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{payment.date}</TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge size="sm" color={
                      payment.status === "Completed" ? "success" :
                      payment.status === "Pending" ? "warning" : "error"
                    }>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <RecordPaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
