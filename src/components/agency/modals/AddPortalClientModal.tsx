"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface AddPortalClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: any) => void;
  editing?: any;
}

export const AddPortalClientModal: React.FC<AddPortalClientModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  editing,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;

  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setName(editing.name || "");
      setEmail(editing.email || "");
      setPassword("");
      setClientId(editing.client_id || "");
      setAvatarUrl(editing.avatar_url || "");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setClientId("");
      setAvatarUrl("");
    }
    setError(null);
  }, [editing, isOpen]);

  // Fetch clients for dropdown
  useEffect(() => {
    if (!isOpen) return;
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const json = await res.json();
          setClients(Array.isArray(json) ? json : json.data || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, any> = {
        name,
        email,
        client_id: clientId || null,
        avatar_url: avatarUrl || null,
      };

      if (!isEditing || password) {
        body.password = password;
      }

      const url = isEditing
        ? `/api/portal/clients/${editing.id}`
        : "/api/portal/clients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save portal client");
      }

      const data = await res.json();
      onCreated(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        {isEditing ? "Edit Portal Client" : "Add Portal Client"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password{" "}
            {!isEditing && <span className="text-red-500">*</span>}
            {isEditing && (
              <span className="text-gray-400">(leave blank to keep)</span>
            )}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEditing}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder={isEditing ? "Leave blank to keep current" : "Password"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Linked Client
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">No linked client</option>
            {loadingClients ? (
              <option disabled>Loading...</option>
            ) : (
              clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` (${c.company})` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-600 disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Update Client"
                : "Create Client"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
