"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AddClientModal, ImportDataModal } from "./modals";
import { ClientDetailsSidebar } from "./sidebars";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: "active" | "inactive" | "archived";
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  industry: string | null;
  source: string | null;
  tags: string[] | null;
  total_revenue: number;
  events_count: number;
  created_at: string;
  updated_at: string;
}

function capitalizeName(str: string | null): string {
  if (!str) return "-";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const ClientsTable = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch clients");
      }

      setClients(data.clients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete client");
      }

      setClients(clients.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete client");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleClientSaved = (client: Client) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      setClients([client, ...clients]);
    }
    handleModalClose();
  };

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "archived":
        return "warning";
      default:
        return "primary";
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchClients}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Clients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {clients.length} {clients.length === 1 ? "client" : "clients"} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button
              onClick={handleAddClient}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Client
            </button>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No clients yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first client.
            </p>
            <button
              onClick={handleAddClient}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Add Client
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
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
                    Company
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
                    Events
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Revenue
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
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="py-3">
                      <div>
                        <button
                          onClick={() => handleViewClient(client)}
                          className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                        >
                          {capitalizeName(client.name)}
                        </button>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {client.email || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {client.company || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getStatusColor(client.status) as "success" | "warning" | "error" | "primary"}
                      >
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {client.events_count}
                    </TableCell>
                    <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {formatRevenue(client.total_revenue || 0)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={deletingId === client.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          {deletingId === client.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleClientSaved}
        client={editingClient}
      />

      <ClientDetailsSidebar
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        client={viewingClient}
        onEdit={(client) => {
          setViewingClient(null);
          handleEditClient(client);
        }}
        onDelete={handleDeleteClient}
      />

      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="clients"
        onImportComplete={fetchClients}
      />
    </>
  );
};
