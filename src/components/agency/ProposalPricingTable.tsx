"use client";
import React from "react";

export interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface ProposalPricingTableProps {
  items: PricingItem[];
  onChange: (items: PricingItem[]) => void;
  subtotal: number;
  discountPercent: number;
  taxPercent: number;
  onDiscountChange: (v: number) => void;
  onTaxChange: (v: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const ProposalPricingTable: React.FC<ProposalPricingTableProps> = ({
  items,
  onChange,
  subtotal,
  discountPercent,
  taxPercent,
  onDiscountChange,
  onTaxChange,
}) => {
  const updateItem = (id: string, field: keyof PricingItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        rate: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxAmount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Rate</div>
        <div className="col-span-2 text-right">Subtotal</div>
        <div className="col-span-1" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 gap-2 items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50"
          >
            <div className="col-span-5">
              <input
                type="text"
                placeholder="Item description"
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                placeholder="1"
                min="0"
                step="0.01"
                value={item.quantity || ""}
                onChange={(e) =>
                  updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={item.rate || ""}
                onChange={(e) =>
                  updateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
            <div className="col-span-2 text-right text-sm font-medium text-gray-800 dark:text-white">
              {formatCurrency(item.quantity * item.rate)}
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                title="Remove item"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item */}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Line Item
      </button>

      {/* Totals */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Discount</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercent || ""}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                className="h-8 w-16 rounded-md border border-gray-300 bg-white px-2 text-center text-xs text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <span className="text-gray-400">%</span>
            </div>
            <span className="text-error-500">
              {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Tax</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercent || ""}
                onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
                className="h-8 w-16 rounded-md border border-gray-300 bg-white px-2 text-center text-xs text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <span className="text-gray-400">%</span>
            </div>
            <span className="text-gray-800 dark:text-white">
              {formatCurrency(taxAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
            <span className="font-semibold text-gray-800 dark:text-white">Total</span>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalPricingTable;
