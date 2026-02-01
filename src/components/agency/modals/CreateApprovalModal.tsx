"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";

interface DropdownOption {
  id: string;
  name: string;
  title?: string;
}

interface CreateApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (approval: any) => void;
}

export const CreateApprovalModal: React.FC<CreateApprovalModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [portalClientId, setPortalClientId] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [newFileUrl, setNewFileUrl] = useState("");

  const [projects, setProjects] = useState<DropdownOption[]>([]);
  const [tasks, setTasks] = useState<DropdownOption[]>([]);
  const [portalClients, setPortalClients] = useState<DropdownOption[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setProjectId("");
      setTaskId("");
      setPortalClientId("");
      setFileUrls([]);
      setNewFileUrl("");
      setError(null);
    }
  }, [isOpen]);

  // Fetch projects
  useEffect(() => {
    if (!isOpen) return;
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const json = await res.json();
          setProjects(Array.isArray(json) ? json : json.data || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isOpen]);

  // Fetch portal clients
  useEffect(() => {
    if (!isOpen) return;
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await fetch("/api/portal/clients");
        if (res.ok) {
          const json = await res.json();
          setPortalClients(Array.isArray(json) ? json : json.data || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [isOpen]);

  // Fetch tasks filtered by project
  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setTaskId("");
      return;
    }
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await fetch(`/api/tasks?project_id=${projectId}`);
        if (res.ok) {
          const json = await res.json();
          setTasks(Array.isArray(json) ? json : json.data || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  const addFileUrl = () => {
    const trimmed = newFileUrl.trim();
    if (trimmed && !fileUrls.includes(trimmed)) {
      setFileUrls([...fileUrls, trimmed]);
      setNewFileUrl("");
    }
  };

  const removeFileUrl = (idx: number) => {
    setFileUrls(fileUrls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body = {
        title,
        description: description || null,
        project_id: projectId || null,
        task_id: taskId || null,
        portal_client_id: portalClientId || null,
        file_urls: fileUrls,
      };

      const res = await fetch("/api/portal/approvals/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create approval");
        return;
      }

      const data = await res.json();
      onCreated(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        Create Approval Request
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Approval title"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Describe what needs approval..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">No project</option>
            {loadingProjects ? (
              <option disabled>Loading...</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.title}
                </option>
              ))
            )}
          </select>
        </div>

        {projectId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">No task</option>
              {loadingTasks ? (
                <option disabled>Loading...</option>
              ) : (
                tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title || t.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Portal Client
          </label>
          <select
            value={portalClientId}
            onChange={(e) => setPortalClientId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select portal client</option>
            {loadingClients ? (
              <option disabled>Loading...</option>
            ) : (
              portalClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* File URLs */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            File URLs
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newFileUrl}
              onChange={(e) => setNewFileUrl(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="https://example.com/file.pdf"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFileUrl();
                }
              }}
            />
            <button
              type="button"
              onClick={addFileUrl}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Add
            </button>
          </div>
          {fileUrls.length > 0 && (
            <div className="mt-2 space-y-1">
              {fileUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                >
                  <span className="truncate text-xs text-gray-600 dark:text-gray-300">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFileUrl(idx)}
                    className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {submitting ? "Creating..." : "Create Approval"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
