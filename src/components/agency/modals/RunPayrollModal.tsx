"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import type { PayrollRun } from "../PayrollTable";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  hourly_rate: number;
  base_salary?: number;
}

interface EmployeePayroll {
  employee_id: string;
  employee: TeamMember;
  selected: boolean;
  base_salary: number;
  hourly_rate: number;
  hours_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  bonus: number;
  commission: number;
  allowances: number;
  reimbursements: number;
  tax_federal: number;
  tax_state: number;
  tax_local: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  dental_insurance: number;
  vision_insurance: number;
  retirement_401k: number;
  other_deductions: number;
  payment_method: string;
  notes: string;
}

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payrollRun: PayrollRun) => void;
}

const paymentMethods = [
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "wire_transfer", label: "Wire Transfer" },
];

export function RunPayrollModal({ isOpen, onClose, onSave }: RunPayrollModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"period" | "employees" | "review">("period");
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    period_start: "",
    period_end: "",
    pay_date: "",
    notes: "",
  });

  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/team/members");
        const data = await res.json();
        if (res.ok) {
          setTeamMembers(data.members || []);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoadingMembers(false);
      }
    };
    if (isOpen) fetchMembers();
  }, [isOpen]);

  // Initialize employees when team members are loaded
  useEffect(() => {
    if (teamMembers.length > 0 && employees.length === 0) {
      setEmployees(
        teamMembers.map((m) => ({
          employee_id: m.id,
          employee: m,
          selected: true,
          base_salary: m.base_salary || 0,
          hourly_rate: m.hourly_rate || 0,
          hours_worked: 80, // Default 2-week pay period
          overtime_hours: 0,
          overtime_rate: (m.hourly_rate || 0) * 1.5,
          bonus: 0,
          commission: 0,
          allowances: 0,
          reimbursements: 0,
          tax_federal: 0,
          tax_state: 0,
          tax_local: 0,
          social_security: 0,
          medicare: 0,
          health_insurance: 0,
          dental_insurance: 0,
          vision_insurance: 0,
          retirement_401k: 0,
          other_deductions: 0,
          payment_method: "direct_deposit",
          notes: "",
        }))
      );
    }
  }, [teamMembers, employees.length]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setStep("period");
      setFormData({
        name: "",
        period_start: "",
        period_end: "",
        pay_date: "",
        notes: "",
      });
      setEmployees([]);
      setError("");
      setEditingEmployee(null);
    }
  }, [isOpen]);

  // Calculate pay for an employee
  const calculatePay = (emp: EmployeePayroll) => {
    const regularPay = emp.hourly_rate * emp.hours_worked + emp.base_salary;
    const overtimePay = emp.overtime_rate * emp.overtime_hours;
    const grossPay = regularPay + overtimePay + emp.bonus + emp.commission + emp.allowances + emp.reimbursements;

    const totalDeductions =
      emp.tax_federal + emp.tax_state + emp.tax_local +
      emp.social_security + emp.medicare +
      emp.health_insurance + emp.dental_insurance + emp.vision_insurance +
      emp.retirement_401k + emp.other_deductions;

    const netPay = grossPay - totalDeductions;

    return { regularPay, overtimePay, grossPay, totalDeductions, netPay };
  };

  const toggleEmployee = (id: string) => {
    setEmployees(
      employees.map((e) =>
        e.employee_id === id ? { ...e, selected: !e.selected } : e
      )
    );
  };

  const updateEmployee = (id: string, updates: Partial<EmployeePayroll>) => {
    setEmployees(
      employees.map((e) =>
        e.employee_id === id ? { ...e, ...updates } : e
      )
    );
  };

  const selectedEmployees = employees.filter((e) => e.selected);
  const totalPayroll = selectedEmployees.reduce((sum, e) => {
    const { netPay } = calculatePay(e);
    return sum + netPay;
  }, 0);
  const totalGross = selectedEmployees.reduce((sum, e) => {
    const { grossPay } = calculatePay(e);
    return sum + grossPay;
  }, 0);
  const totalDeductions = selectedEmployees.reduce((sum, e) => {
    const { totalDeductions: deductions } = calculatePay(e);
    return sum + deductions;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "period") {
      if (!formData.period_start || !formData.period_end || !formData.pay_date) {
        setError("Please fill in all required fields");
        return;
      }
      setError("");
      setStep("employees");
      return;
    }

    if (step === "employees") {
      if (selectedEmployees.length === 0) {
        setError("Please select at least one employee");
        return;
      }
      setError("");
      setStep("review");
      return;
    }

    // Final submission
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: formData.name || `Payroll ${formData.period_start} - ${formData.period_end}`,
        period_start: formData.period_start,
        period_end: formData.period_end,
        pay_date: formData.pay_date,
        notes: formData.notes || null,
        employees: selectedEmployees.map((emp) => ({
          employee_id: emp.employee_id,
          base_salary: emp.base_salary,
          hourly_rate: emp.hourly_rate,
          hours_worked: emp.hours_worked,
          overtime_hours: emp.overtime_hours,
          overtime_rate: emp.overtime_rate,
          bonus: emp.bonus,
          commission: emp.commission,
          allowances: emp.allowances,
          reimbursements: emp.reimbursements,
          tax_federal: emp.tax_federal,
          tax_state: emp.tax_state,
          tax_local: emp.tax_local,
          social_security: emp.social_security,
          medicare: emp.medicare,
          health_insurance: emp.health_insurance,
          dental_insurance: emp.dental_insurance,
          vision_insurance: emp.vision_insurance,
          retirement_401k: emp.retirement_401k,
          other_deductions: emp.other_deductions,
          payment_method: emp.payment_method,
          notes: emp.notes || null,
        })),
      };

      const res = await fetch("/api/team/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create payroll run");
        return;
      }

      if (onSave) {
        onSave(data.payrollRun);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getEmployeeName = (emp: EmployeePayroll) => {
    return `${emp.employee.first_name} ${emp.employee.last_name || ""}`.trim();
  };

  const getEmployeeInitials = (emp: EmployeePayroll) => {
    const first = emp.employee.first_name?.[0] || "";
    const last = emp.employee.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Run Payroll
          </h2>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["period", "employees", "review"].map((s, i) => (
              <div
                key={s}
                className={`flex items-center ${i > 0 ? "ml-2" : ""}`}
              >
                {i > 0 && (
                  <div className={`w-8 h-0.5 ${step === s || ["employees", "review"].indexOf(step) > ["employees", "review"].indexOf(s) ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s
                      ? "bg-brand-500 text-white"
                      : ["period", "employees", "review"].indexOf(step) > ["period", "employees", "review"].indexOf(s)
                      ? "bg-success-500 text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Pay Period */}
          {step === "period" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name">Payroll Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g., January 2025 Payroll"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_start">Period Start *</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="period_end">Period End *</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pay_date">Payment Date *</Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={formData.pay_date}
                  onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Add any notes for this payroll run..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Employees */}
          {step === "employees" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Select employees to include in this payroll run and adjust their pay details.
              </p>

              {loadingMembers ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading team members...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No team members found.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                  {employees.map((emp) => {
                    const { grossPay, netPay } = calculatePay(emp);
                    const isEditing = editingEmployee === emp.employee_id;

                    return (
                      <div
                        key={emp.employee_id}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        {/* Employee Row */}
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={emp.selected}
                              onChange={() => toggleEmployee(emp.employee_id)}
                              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            {emp.employee.avatar_url ? (
                              <img
                                src={emp.employee.avatar_url}
                                alt={getEmployeeName(emp)}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                                {getEmployeeInitials(emp)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white/90 text-sm">
                                {getEmployeeName(emp)}
                              </p>
                              {emp.employee.job_title && (
                                <p className="text-xs text-gray-500">{emp.employee.job_title}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {formatCurrency(netPay)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Gross: {formatCurrency(grossPay)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(isEditing ? null : emp.employee_id)}
                              className="text-brand-500 hover:text-brand-600 text-sm"
                            >
                              {isEditing ? "Done" : "Edit"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Edit Form */}
                        {isEditing && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <Label htmlFor={`base_salary_${emp.employee_id}`} className="text-xs">Base Salary</Label>
                                <Input
                                  id={`base_salary_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.base_salary || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { base_salary: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`hourly_rate_${emp.employee_id}`} className="text-xs">Hourly Rate</Label>
                                <Input
                                  id={`hourly_rate_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.hourly_rate || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { hourly_rate: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`hours_worked_${emp.employee_id}`} className="text-xs">Hours Worked</Label>
                                <Input
                                  id={`hours_worked_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  value={emp.hours_worked || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { hours_worked: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`overtime_hours_${emp.employee_id}`} className="text-xs">Overtime Hours</Label>
                                <Input
                                  id={`overtime_hours_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  value={emp.overtime_hours || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { overtime_hours: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`bonus_${emp.employee_id}`} className="text-xs">Bonus</Label>
                                <Input
                                  id={`bonus_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.bonus || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { bonus: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`commission_${emp.employee_id}`} className="text-xs">Commission</Label>
                                <Input
                                  id={`commission_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.commission || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { commission: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`tax_federal_${emp.employee_id}`} className="text-xs">Federal Tax</Label>
                                <Input
                                  id={`tax_federal_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.tax_federal || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { tax_federal: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`tax_state_${emp.employee_id}`} className="text-xs">State Tax</Label>
                                <Input
                                  id={`tax_state_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.tax_state || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { tax_state: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`health_insurance_${emp.employee_id}`} className="text-xs">Health Insurance</Label>
                                <Input
                                  id={`health_insurance_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.health_insurance || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { health_insurance: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`retirement_401k_${emp.employee_id}`} className="text-xs">401(k)</Label>
                                <Input
                                  id={`retirement_401k_${emp.employee_id}`}
                                  type="number"
                                  min="0"
                                  step={0.01}
                                  value={emp.retirement_401k || ""}
                                  onChange={(e) => updateEmployee(emp.employee_id, { retirement_401k: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor={`payment_method_${emp.employee_id}`} className="text-xs">Payment Method</Label>
                                <select
                                  id={`payment_method_${emp.employee_id}`}
                                  value={emp.payment_method}
                                  onChange={(e) => updateEmployee(emp.employee_id, { payment_method: e.target.value })}
                                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                >
                                  {paymentMethods.map((m) => (
                                    <option key={m.value} value={m.value}>
                                      {m.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
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
                    {formatCurrency(totalPayroll)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-medium text-gray-800 dark:text-white/90 mb-3">Payroll Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Pay Period</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {formData.period_start} to {formData.period_end}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Date</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">{formData.pay_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employees</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">{selectedEmployees.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gross Pay</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(totalGross)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Deductions</p>
                    <p className="font-medium text-error-500">{formatCurrency(totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Net Pay</p>
                    <p className="text-lg font-bold text-success-500">{formatCurrency(totalPayroll)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                {selectedEmployees.map((emp) => {
                  const { netPay } = calculatePay(emp);
                  return (
                    <div
                      key={emp.employee_id}
                      className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {emp.employee.avatar_url ? (
                          <img
                            src={emp.employee.avatar_url}
                            alt={getEmployeeName(emp)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                            {getEmployeeInitials(emp)}
                          </div>
                        )}
                        <span className="text-gray-800 dark:text-white/90">{getEmployeeName(emp)}</span>
                      </div>
                      <span className="font-medium text-success-500">{formatCurrency(netPay)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div>
              {step !== "period" && (
                <button
                  type="button"
                  onClick={() => setStep(step === "review" ? "employees" : "period")}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : step === "review"
                  ? "Create Payroll Run"
                  : "Continue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
