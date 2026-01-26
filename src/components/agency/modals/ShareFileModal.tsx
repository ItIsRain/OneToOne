"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import type { FileShareRecord } from "../SharedFilesTable";

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (share: FileShareRecord) => void;
  preselectedFileId?: string | null;
}

interface FileOption {
  id: string;
  name: string;
  file_type: string;
}

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

const permissions = [
  { value: "view", label: "View Only" },
  { value: "download", label: "View & Download" },
  { value: "edit", label: "Full Access" },
];

const shareTypes = [
  { value: "link", label: "Public Link" },
  { value: "email", label: "Email Share" },
  { value: "client", label: "Client Share" },
];

export function ShareFileModal({ isOpen, onClose, onSuccess, preselectedFileId }: ShareFileModalProps) {
  const [formData, setFormData] = useState({
    file_id: preselectedFileId || "",
    share_type: "link",
    permission_level: "view",
    expires_at: "",
    password: "",
    message: "",
    max_downloads: "",
    max_views: "",
    can_reshare: false,
    can_comment: false,
    notify_on_access: false,
    notify_on_download: true,
    requires_authentication: false,
  });

  const [files, setFiles] = useState<FileOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recipients" | "settings" | "security">("recipients");

  // Fetch files and clients on mount
  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      fetchClients();
      if (preselectedFileId) {
        setFormData((prev) => ({ ...prev, file_id: preselectedFileId }));
      }
    }
  }, [isOpen, preselectedFileId]);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/documents/files?limit=100");
      if (res.ok) {
        const data = await res.json();
        setFiles(
          data.files.map((f: { id: string; name: string; file_type: string }) => ({
            id: f.id,
            name: f.name,
            file_type: f.file_type,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const addEmailRecipient = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !emailRecipients.includes(email)) {
      setEmailRecipients((prev) => [...prev, email]);
      setEmailInput("");
    }
  };

  const removeEmailRecipient = (email: string) => {
    setEmailRecipients((prev) => prev.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file_id) {
      setError("Please select a file to share");
      return;
    }

    if (formData.share_type === "client" && selectedClients.length === 0) {
      setError("Please select at least one client");
      return;
    }

    if (formData.share_type === "email" && emailRecipients.length === 0) {
      setError("Please add at least one email recipient");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create shares for each recipient (or single share for link type)
      const sharePromises: Promise<Response>[] = [];

      if (formData.share_type === "link") {
        // Single public link share
        sharePromises.push(createShare(null, null));
      } else if (formData.share_type === "client") {
        // Create share for each selected client
        for (const clientId of selectedClients) {
          sharePromises.push(createShare(clientId, null));
        }
      } else if (formData.share_type === "email") {
        // Create share for each email recipient
        for (const email of emailRecipients) {
          sharePromises.push(createShare(null, email));
        }
      }

      const responses = await Promise.all(sharePromises);
      const failedResponses = responses.filter((r) => !r.ok);

      if (failedResponses.length > 0) {
        throw new Error(`Failed to create ${failedResponses.length} share(s)`);
      }

      // Get the first share to return
      const firstResponse = responses[0];
      if (firstResponse.ok) {
        const { share } = await firstResponse.json();
        if (onSuccess) {
          onSuccess(share);
        }
      }

      handleClose();
    } catch (err) {
      console.error("Share creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create share");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createShare = async (clientId: string | null, email: string | null): Promise<Response> => {
    const body: Record<string, unknown> = {
      file_id: formData.file_id,
      share_type: formData.share_type,
      permission_level: formData.permission_level,
      can_reshare: formData.can_reshare,
      can_comment: formData.can_comment,
      notify_on_access: formData.notify_on_access,
      notify_on_download: formData.notify_on_download,
      requires_authentication: formData.requires_authentication,
    };

    if (formData.expires_at) {
      body.expires_at = new Date(formData.expires_at).toISOString();
    }

    if (formData.password) {
      body.password = formData.password;
    }

    if (formData.message) {
      body.message = formData.message;
    }

    if (formData.max_downloads) {
      body.max_downloads = parseInt(formData.max_downloads, 10);
    }

    if (formData.max_views) {
      body.max_views = parseInt(formData.max_views, 10);
    }

    if (clientId) {
      body.client_id = clientId;
    }

    if (email) {
      body.shared_with_email = email;
    }

    return fetch("/api/documents/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const handleClose = () => {
    setFormData({
      file_id: "",
      share_type: "link",
      permission_level: "view",
      expires_at: "",
      password: "",
      message: "",
      max_downloads: "",
      max_views: "",
      can_reshare: false,
      can_comment: false,
      notify_on_access: false,
      notify_on_download: true,
      requires_authentication: false,
    });
    setSelectedClients([]);
    setEmailRecipients([]);
    setEmailInput("");
    setError(null);
    setActiveTab("recipients");
    onClose();
  };

  const fileOptions = files.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  const tabs = [
    { id: "recipients" as const, label: "Recipients" },
    { id: "settings" as const, label: "Settings" },
    { id: "security" as const, label: "Security" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Share File
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipients Tab */}
          {activeTab === "recipients" && (
            <>
              <div>
                <Label htmlFor="file">Select File *</Label>
                <Select
                  options={fileOptions}
                  defaultValue={formData.file_id}
                  onChange={(value) => setFormData({ ...formData, file_id: value })}
                  placeholder="Choose a file to share"
                />
              </div>

              <div>
                <Label htmlFor="share_type">Share Type</Label>
                <Select
                  options={shareTypes}
                  defaultValue={formData.share_type}
                  onChange={(value) => setFormData({ ...formData, share_type: value })}
                />
              </div>

              {/* Client Selection */}
              {formData.share_type === "client" && (
                <div>
                  <Label>Select Clients</Label>
                  <div className="mt-2 space-y-2">
                    {selectedClients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedClients.map((clientId) => {
                          const client = clients.find((c) => c.id === clientId);
                          return (
                            <span
                              key={clientId}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-sm dark:bg-brand-500/20 dark:text-brand-400"
                            >
                              {client?.name || clientId}
                              <button
                                type="button"
                                onClick={() => toggleClient(clientId)}
                                className="ml-1 hover:text-brand-800"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {clients.map((client) => (
                        <label
                          key={client.id}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => toggleClient(client.id)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-800 dark:text-white/90 block truncate">
                              {client.name}
                            </span>
                            {client.company && (
                              <span className="text-xs text-gray-500 block truncate">
                                {client.company}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Recipients */}
              {formData.share_type === "email" && (
                <div>
                  <Label>Email Recipients</Label>
                  <div className="mt-2 space-y-2">
                    {emailRecipients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {emailRecipients.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-sm dark:bg-brand-500/20 dark:text-brand-400"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeEmailRecipient(email)}
                              className="ml-1 hover:text-brand-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addEmailRecipient();
                          }
                        }}
                        className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={addEmailRecipient}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <textarea
                  id="message"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Add a message for the recipients..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <>
              <div>
                <Label htmlFor="permission">Permission Level</Label>
                <Select
                  options={permissions}
                  defaultValue={formData.permission_level}
                  onChange={(value) => setFormData({ ...formData, permission_level: value })}
                />
              </div>

              <div>
                <Label htmlFor="expires_at">Link Expiry (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_views">Max Views (Optional)</Label>
                  <Input
                    id="max_views"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.max_views}
                    onChange={(e) => setFormData({ ...formData, max_views: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_downloads">Max Downloads (Optional)</Label>
                  <Input
                    id="max_downloads"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.max_downloads}
                    onChange={(e) => setFormData({ ...formData, max_downloads: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_reshare}
                    onChange={(e) => setFormData({ ...formData, can_reshare: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Allow Resharing</span>
                    <p className="text-xs text-gray-500">Recipients can share this file with others</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_comment}
                    onChange={(e) => setFormData({ ...formData, can_comment: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Allow Comments</span>
                    <p className="text-xs text-gray-500">Recipients can add comments to the file</p>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <>
              <div>
                <Label htmlFor="password">Password Protection (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Set a password for this share"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recipients will need to enter this password to access the file.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_authentication}
                    onChange={(e) => setFormData({ ...formData, requires_authentication: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Require Login</span>
                    <p className="text-xs text-gray-500">Recipients must be logged in to access</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notify_on_access}
                    onChange={(e) => setFormData({ ...formData, notify_on_access: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Notify on Access</span>
                    <p className="text-xs text-gray-500">Get notified when someone views the file</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notify_on_download}
                    onChange={(e) => setFormData({ ...formData, notify_on_download: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Notify on Download</span>
                    <p className="text-xs text-gray-500">Get notified when someone downloads the file</p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.file_id}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Share File"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
