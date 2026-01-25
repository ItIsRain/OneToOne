import type { Metadata } from "next";
import { ClientsTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Clients | Agency Portal",
  description: "Manage your client relationships",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Clients
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage and track all your client relationships
        </p>
      </div>
      <ClientsTable />
    </div>
  );
}
