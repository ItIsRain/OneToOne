"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { PayrollRun, PayrollItem } from "../PayrollTable";

interface PayrollDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRun: PayrollRun | null;
  onStatusChange?: (run: PayrollRun, newStatus: string) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  pending_approval: { label: "Pending Approval", color: "warning" },
  approved: { label: "Approved", color: "primary" },
  processing: { label: "Processing", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

const paymentMethodLabels: Record<string, string> = {
  direct_deposit: "Direct Deposit",
  check: "Check",
  cash: "Cash",
  wire_transfer: "Wire Transfer",
};

export const PayrollDetailsSidebar: React.FC<PayrollDetailsSidebarProps> = ({
  isOpen,
  onClose,
  payrollRun,
  onStatusChange,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  if (!payrollRun) return null;

  const status = statusConfig[payrollRun.status] || statusConfig.draft;
  const canDelete = payrollRun.status === "draft";
  const items = payrollRun.items || [];

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payroll run?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(payrollRun.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getEmployeeName = (item: PayrollItem) => {
    if (!item.employee) return "Unknown";
    return `${item.employee.first_name} ${item.employee.last_name || ""}`.trim();
  };

  const getEmployeeInitials = (item: PayrollItem) => {
    if (!item.employee) return "?";
    const first = item.employee.first_name?.[0] || "";
    const last = item.employee.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getCreatorName = () => {
    if (!payrollRun.created_by_user) return "Unknown";
    return `${payrollRun.created_by_user.first_name} ${payrollRun.created_by_user.last_name || ""}`.trim();
  };

  const headerActions = (
    <>
      {canDelete && onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={payrollRun.run_number}
      subtitle={payrollRun.name}
      headerActions={headerActions}
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={status.color}>
            {status.label}
          </Badge>
          {onStatusChange && (
            <div className="flex items-center gap-2">
              {payrollRun.status === "draft" && (
                <button
                  onClick={() => onStatusChange(payrollRun, "pending_approval")}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Submit for Approval
                </button>
              )}
              {payrollRun.status === "pending_approval" && (
                <>
                  <button
                    onClick={() => onStatusChange(payrollRun, "draft")}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    Return to Draft
                  </button>
                  <button
                    onClick={() => onStatusChange(payrollRun, "approved")}
                    className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
              {payrollRun.status === "approved" && (
                <button
                  onClick={() => onStatusChange(payrollRun, "processing")}
                  className="rounded-lg bg-warning-500 px-4 py-2 text-sm font-medium text-white hover:bg-warning-600 transition-colors"
                >
                  Start Processing
                </button>
              )}
              {payrollRun.status === "processing" && (
                <button
                  onClick={() => onStatusChange(payrollRun, "completed")}
                  className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Gross Pay"
              value={formatCurrency(payrollRun.total_gross)}
            />
            <StatItem
              label="Deductions"
              value={formatCurrency(payrollRun.total_deductions)}
            />
            <StatItem
              label="Net Pay"
              value={formatCurrency(payrollRun.total_net)}
            />
          </StatsGrid>
        </div>

        {/* Pay Period Details */}
        <Section title="Pay Period">
          <InfoRow label="Period Start" value={formatDate(payrollRun.period_start)} />
          <InfoRow label="Period End" value={formatDate(payrollRun.period_end)} />
          <InfoRow label="Pay Date" value={formatDate(payrollRun.pay_date)} />
        </Section>

        {/* Employees */}
        <Section title={`Employees (${items.length})`}>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No employees in this payroll run</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedEmployee(expandedEmployee === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.employee?.avatar_url ? (
                        <img
                          src={item.employee.avatar_url}
                          alt={getEmployeeName(item)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                          {getEmployeeInitials(item)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-gray-800 dark:text-white/90 text-sm">
                          {getEmployeeName(item)}
                        </p>
                        {item.employee?.job_title && (
                          <p className="text-xs text-gray-500">{item.employee.job_title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-success-500">
                        {formatCurrency(item.net_pay)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedEmployee === item.id ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedEmployee === item.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Earnings */}
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Earnings</h4>
                          <div className="space-y-1">
                            {item.base_salary > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Base Salary</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.base_salary)}</span>
                              </div>
                            )}
                            {item.regular_pay > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Regular Pay</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.regular_pay)}</span>
                              </div>
                            )}
                            {item.overtime_pay > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Overtime ({item.overtime_hours}h)</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.overtime_pay)}</span>
                              </div>
                            )}
                            {item.bonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bonus</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.bonus)}</span>
                              </div>
                            )}
                            {item.commission > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Commission</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.commission)}</span>
                              </div>
                            )}
                            {item.allowances > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Allowances</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.allowances)}</span>
                              </div>
                            )}
                            {item.reimbursements > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Reimbursements</span>
                                <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.reimbursements)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600 font-medium">
                              <span className="text-gray-700 dark:text-gray-300">Gross Pay</span>
                              <span className="text-gray-800 dark:text-white/90">{formatCurrency(item.gross_pay)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Deductions</h4>
                          <div className="space-y-1">
                            {item.tax_federal > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Federal Tax</span>
                                <span className="text-error-500">-{formatCurrency(item.tax_federal)}</span>
                              </div>
                            )}
                            {item.tax_state > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">State Tax</span>
                                <span className="text-error-500">-{formatCurrency(item.tax_state)}</span>
                              </div>
                            )}
                            {item.tax_local > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Local Tax</span>
                                <span className="text-error-500">-{formatCurrency(item.tax_local)}</span>
                              </div>
                            )}
                            {item.social_security > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Social Security</span>
                                <span className="text-error-500">-{formatCurrency(item.social_security)}</span>
                              </div>
                            )}
                            {item.medicare > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Medicare</span>
                                <span className="text-error-500">-{formatCurrency(item.medicare)}</span>
                              </div>
                            )}
                            {item.health_insurance > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Health Insurance</span>
                                <span className="text-error-500">-{formatCurrency(item.health_insurance)}</span>
                              </div>
                            )}
                            {item.dental_insurance > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Dental Insurance</span>
                                <span className="text-error-500">-{formatCurrency(item.dental_insurance)}</span>
                              </div>
                            )}
                            {item.vision_insurance > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Vision Insurance</span>
                                <span className="text-error-500">-{formatCurrency(item.vision_insurance)}</span>
                              </div>
                            )}
                            {item.retirement_401k > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">401(k)</span>
                                <span className="text-error-500">-{formatCurrency(item.retirement_401k)}</span>
                              </div>
                            )}
                            {item.other_deductions > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Other</span>
                                <span className="text-error-500">-{formatCurrency(item.other_deductions)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600 font-medium">
                              <span className="text-gray-700 dark:text-gray-300">Total Deductions</span>
                              <span className="text-error-500">-{formatCurrency(item.total_deductions)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Net Pay & Payment Info */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-gray-500">Payment Method: </span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {paymentMethodLabels[item.payment_method] || item.payment_method}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Net Pay</p>
                          <p className="text-lg font-bold text-success-500">{formatCurrency(item.net_pay)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notes */}
        {payrollRun.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {payrollRun.notes}
            </p>
          </Section>
        )}

        {/* Audit Trail */}
        <Section title="Audit Trail">
          <div className="space-y-3">
            <InfoRow label="Created By" value={getCreatorName()} />
            <InfoRow label="Created At" value={formatDateTime(payrollRun.created_at)} />
            {payrollRun.approved_by_user && (
              <>
                <InfoRow
                  label="Approved By"
                  value={`${payrollRun.approved_by_user.first_name} ${payrollRun.approved_by_user.last_name || ""}`.trim()}
                />
                <InfoRow label="Approved At" value={formatDateTime(payrollRun.approved_at)} />
              </>
            )}
            {payrollRun.processed_by_user && (
              <>
                <InfoRow
                  label="Processed By"
                  value={`${payrollRun.processed_by_user.first_name} ${payrollRun.processed_by_user.last_name || ""}`.trim()}
                />
                <InfoRow label="Processed At" value={formatDateTime(payrollRun.processed_at)} />
              </>
            )}
          </div>
        </Section>

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Last Updated: {formatDateTime(payrollRun.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default PayrollDetailsSidebar;
