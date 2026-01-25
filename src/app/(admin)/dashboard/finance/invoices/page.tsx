import type { Metadata } from "next";
import { InvoicesTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Invoices | Finance",
  description: "Manage invoices and billing",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Invoices</h1>
        <p className="text-gray-500 dark:text-gray-400">Create, send, and track all invoices</p>
      </div>
      <InvoicesTable />
    </div>
  );
}
