"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { AddPortalClientModal } from "@/components/agency/modals/AddPortalClientModal";

interface PortalClient {
  id: string;
  tenant_id: string;
  client_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  last_login_at: string | null;
  is_active: boolean;
  created_at: string;
  client?: { id: string; name: string; company: string | null };
}

export const PortalClientsTable: React.FC = () => {
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortalClient | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/clients");
      if (!res.ok) throw new Error("Failed to load portal clients");
      const json = await res.json();
      setClients(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleToggleActive = async (client: PortalClient) => {
    try {
      await fetch(`/api/portal/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !client.is_active }),
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    } catch {
      // Silently handle error
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this portal client?")) return;
    try {
      await fetch(`/api/portal/clients/${clientId}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch {
      // Silently handle error
    }
  };

  const handleEdit = (client: PortalClient) => {
    setEditing(client);
    setModalOpen(true);
  };

  const handleCreated = () => {
    setModalOpen(false);
    setEditing(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Portal Clients
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-600"
        >
          Add Portal Client
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Linked Client
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Last Login
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Active
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No portal clients yet.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {client.avatar_url ? (
                          <img
                            src={client.avatar_url}
                            alt={client.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-100 text-xs font-bold text-lime-700 dark:bg-lime-900/30 dark:text-lime-400">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {client.email}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {client.client
                        ? client.client.company
                          ? `${client.client.name} (${client.client.company})`
                          : client.client.name
                        : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {client.last_login_at
                        ? new Date(client.last_login_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(client)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          client.is_active
                            ? "bg-lime-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            client.is_active
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                          title="Edit"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddPortalClientModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onCreated={handleCreated}
        editing={editing}
      />
    </div>
  );
};
