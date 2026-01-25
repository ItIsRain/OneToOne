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
import { AddExpenseModal } from "@/components/agency/modals";

const expenses = [
  { id: 1, description: "Venue Rental - Grand Ballroom", category: "Venues", amount: "$3,000", date: "Jan 24, 2025", status: "Approved", project: "Product Launch" },
  { id: 2, description: "Catering Services", category: "Food & Beverage", amount: "$1,500", date: "Jan 23, 2025", status: "Pending", project: "Annual Gala" },
  { id: 3, description: "Marketing Materials", category: "Marketing", amount: "$800", date: "Jan 22, 2025", status: "Approved", project: "Brand Campaign" },
  { id: 4, description: "Software Subscription", category: "Technology", amount: "$299", date: "Jan 22, 2025", status: "Approved", project: "Operations" },
  { id: 5, description: "Travel Expenses", category: "Travel", amount: "$1,200", date: "Jan 20, 2025", status: "Pending", project: "Client Meeting" },
  { id: 6, description: "Equipment Rental", category: "Equipment", amount: "$2,500", date: "Jan 18, 2025", status: "Approved", project: "Tech Conference" },
];

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Expenses</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and manage business expenses</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Expense
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">This Month</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">$9,299</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <h3 className="text-2xl font-bold text-warning-500 mt-1">$2,700</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Budget Remaining</p>
            <h3 className="text-2xl font-bold text-success-500 mt-1">$15,701</h3>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Description</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Category</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Project</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Date</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Amount</TableCell>
                <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{expense.description}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{expense.category}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{expense.project}</TableCell>
                  <TableCell className="py-4 px-6 text-gray-500">{expense.date}</TableCell>
                  <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{expense.amount}</TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge size="sm" color={expense.status === "Approved" ? "success" : "warning"}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
