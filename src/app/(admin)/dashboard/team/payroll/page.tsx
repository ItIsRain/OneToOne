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
import { RunPayrollModal } from "@/components/agency/modals";

const payrollData = [
  { id: 1, name: "Alex Johnson", role: "Project Manager", salary: "$6,500", bonus: "$500", deductions: "$1,200", netPay: "$5,800", status: "Paid" },
  { id: 2, name: "Sarah Williams", role: "Senior Designer", salary: "$5,500", bonus: "$300", deductions: "$980", netPay: "$4,820", status: "Paid" },
  { id: 3, name: "Michael Chen", role: "Developer", salary: "$5,000", bonus: "$400", deductions: "$900", netPay: "$4,500", status: "Pending" },
  { id: 4, name: "James Wilson", role: "Marketing Specialist", salary: "$4,500", bonus: "$200", deductions: "$820", netPay: "$3,880", status: "Paid" },
  { id: 5, name: "Lisa Thompson", role: "Event Coordinator", salary: "$4,200", bonus: "$250", deductions: "$780", netPay: "$3,670", status: "Pending" },
];

export default function PayrollPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Payroll</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employee salaries and payments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Run Payroll
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">$25,700</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Total Bonuses</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">$1,650</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Deductions</p>
          <h3 className="text-2xl font-bold text-error-500 mt-1">$4,680</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Net Payout</p>
          <h3 className="text-2xl font-bold text-brand-500 mt-1">$22,670</h3>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Employee</TableCell>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Salary</TableCell>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Bonus</TableCell>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Deductions</TableCell>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Net Pay</TableCell>
              <TableCell isHeader className="py-3 px-6 text-left text-xs font-medium text-gray-500">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {payrollData.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.role}</p>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-500">{employee.salary}</TableCell>
                <TableCell className="py-4 px-6 text-success-500">{employee.bonus}</TableCell>
                <TableCell className="py-4 px-6 text-error-500">{employee.deductions}</TableCell>
                <TableCell className="py-4 px-6 font-medium text-gray-800 dark:text-white/90">{employee.netPay}</TableCell>
                <TableCell className="py-4 px-6">
                  <Badge size="sm" color={employee.status === "Paid" ? "success" : "warning"}>
                    {employee.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RunPayrollModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
