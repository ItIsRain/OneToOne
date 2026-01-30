"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (contractId: string) => void;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface ContractTemplate {
  id: string;
  name: string;
  sections: unknown[];
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/crm/clients")
        .then((res) => (res.ok ? res.json() : { clients: [] }))
        .then((data) => setClients(data.clients || []))
        .catch(() => setClients([]));

      fetch("/api/contracts/templates")
        .then((res) => (res.ok ? res.json() : { templates: [] }))
        .then((data) => setTemplates(data.templates || []))
        .catch(() => setTemplates([]));
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      let sections: unknown[] = [];

      // If template selected, fetch its sections
      if (templateId) {
        const templateRes = await fetch(`/api/contracts/templates/${templateId}`);
        if (templateRes.ok) {
          const templateData = await templateRes.json();
          sections = templateData.template?.sections || [];
        }
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          client_id: clientId || null,
          sections,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create contract");
      }

      const data = await res.json();
      setTitle("");
      setClientId("");
      setTemplateId("");
      onCreated(data.contract.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contract");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          New Contract
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a new contract for a client
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="contract-title">Contract Title</Label>
          <input
            id="contract-title"
            type="text"
            placeholder="e.g. Service Agreement - Project Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <div>
          <Label htmlFor="contract-client">Client (Optional)</Label>
          <select
            id="contract-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}{client.company ? ` (${client.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        {templates.length > 0 && (
          <div>
            <Label htmlFor="contract-template">Template (Optional)</Label>
            <select
              id="contract-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Start from scratch</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.sections?.length || 0} sections)
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Contract"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateContractModal;
