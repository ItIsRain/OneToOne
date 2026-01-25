"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const payPeriods = [
  { value: "jan-2025-2", label: "Jan 16 - Jan 31, 2025" },
  { value: "feb-2025-1", label: "Feb 1 - Feb 15, 2025" },
  { value: "feb-2025-2", label: "Feb 16 - Feb 28, 2025" },
];

const employees = [
  { id: 1, name: "Alex Johnson", salary: 6500, selected: true },
  { id: 2, name: "Sarah Williams", salary: 5500, selected: true },
  { id: 3, name: "Michael Chen", salary: 5000, selected: true },
  { id: 4, name: "James Wilson", salary: 4500, selected: true },
  { id: 5, name: "Lisa Thompson", salary: 4200, selected: true },
];

export function RunPayrollModal({ isOpen, onClose }: RunPayrollModalProps) {
  const [formData, setFormData] = useState({
    payPeriod: "jan-2025-2",
    paymentDate: "",
    notes: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>(
    employees.map((e) => e.id)
  );

  const toggleEmployee = (id: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((eId) => eId !== id) : [...prev, id]
    );
  };

  const totalPayroll = employees
    .filter((e) => selectedEmployees.includes(e.id))
    .reduce((sum, e) => sum + e.salary, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payroll data:", { ...formData, selectedEmployees, totalPayroll });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Run Payroll
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payPeriod">Pay Period</Label>
              <Select
                options={payPeriods}
                defaultValue={formData.payPeriod}
                onChange={(value) => setFormData({ ...formData, payPeriod: value })}
              />
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Select Employees</Label>
            <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-gray-800 dark:text-white/90">{employee.name}</span>
                  </div>
                  <span className="text-gray-500">${employee.salary.toLocaleString()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">Selected Employees:</span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                {selectedEmployees.length} of {employees.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total Payroll:</span>
              <span className="text-xl font-bold text-brand-500">
                ${totalPayroll.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Add any notes for this payroll run..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Process Payroll
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
