"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DetailsSidebar } from "@/components/ui/DetailsSidebar";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  };
}

const PERMISSION_OPTIONS = [
  { value: "read", label: "Read", description: "View data and resources" },
  { value: "write", label: "Write", description: "Create and update resources" },
  { value: "delete", label: "Delete", description: "Delete resources" },
  { value: "events:read", label: "Events Read", description: "View events" },
  { value: "events:write", label: "Events Write", description: "Create and manage events" },
  { value: "attendees:read", label: "Attendees Read", description: "View attendees" },
  { value: "attendees:write", label: "Attendees Write", description: "Manage attendees" },
];

// Permission badge colors
const getPermissionColor = (permission: string): string => {
  if (permission.includes("delete")) return "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400";
  if (permission.includes("write")) return "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400";
  return "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400";
};

export const ApiKeysSettings = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{ full_key: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: "",
    permissions: ["read"] as string[],
    expires_at: "",
  });

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreateKey = async () => {
    if (!keyForm.name) {
      alert("Please enter a name for the API key");
      return;
    }

    setCreatingKey(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyForm.name,
          permissions: keyForm.permissions,
          expires_at: keyForm.expires_at || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewKeyResult({ full_key: data.apiKey.full_key, name: keyForm.name });
      setApiKeys(prev => [data.apiKey, ...prev]);
      setKeyForm({ name: "", permissions: ["read"], expires_at: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleToggleActive = async (key: ApiKey) => {
    try {
      const res = await fetch(`/api/settings/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !key.is_active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setApiKeys(prev =>
        prev.map(k => k.id === key.id ? { ...k, is_active: !k.is_active } : k)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update API key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setApiKeys(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete API key");
    }
  };

  const handleCopyKey = async () => {
    if (!newKeyResult?.full_key) return;

    try {
      await navigator.clipboard.writeText(newKeyResult.full_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy key");
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setKeyForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-error-500">{error}</p>
        <button onClick={fetchApiKeys} className="mt-2 text-brand-500 hover:text-brand-600">
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* API Keys Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">API Keys</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage API keys for programmatic access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateKey(true)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Key
              </button>
            </div>

            {/* Security Notice */}
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-500/10 dark:border-amber-500/30">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Keep your API keys secure</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Never share your API keys or commit them to version control. Keys are shown only once upon creation.
                  </p>
                </div>
              </div>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-800 dark:text-white">No API keys yet</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Create your first API key to start integrating with the API.
                </p>
                <button
                  onClick={() => setShowCreateKey(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Key
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`rounded-xl border p-4 transition-all ${
                      key.is_active
                        ? "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-800 dark:text-white">{key.name}</h4>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            key.is_active
                              ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {key.is_active ? "Active" : "Revoked"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {key.key_prefix}
                          </code>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {key.permissions.map((perm) => (
                            <span
                              key={perm}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPermissionColor(perm)}`}
                            >
                              {perm}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Created {formatRelativeDate(key.created_at)}</span>
                          <span>Last used: {key.last_used_at ? formatRelativeDate(key.last_used_at) : "Never"}</span>
                          {key.expires_at && (
                            <span className={new Date(key.expires_at) < new Date() ? "text-error-500" : ""}>
                              Expires: {formatDate(key.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(key)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            key.is_active
                              ? "text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-500/10"
                              : "text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
                          }`}
                        >
                          {key.is_active ? "Revoke" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Guide */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-600" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Quick Start</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">How to use your API key</p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-900 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                <code>{`curl -X GET "https://api.example.com/v1/events" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Include your API key in the Authorization header of all API requests.
            </p>
          </div>
        </div>
      </div>

      {/* Create Key Sidebar */}
      <DetailsSidebar
        isOpen={showCreateKey && !newKeyResult}
        onClose={() => {
          setShowCreateKey(false);
          setKeyForm({ name: "", permissions: ["read"], expires_at: "" });
        }}
        title="Create API Key"
        subtitle="Generate a new API key for your application"
        width="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowCreateKey(false);
                setKeyForm({ name: "", permissions: ["read"], expires_at: "" });
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateKey}
              disabled={creatingKey || !keyForm.name}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {creatingKey ? "Creating..." : "Create Key"}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Key Name *
            </label>
            <input
              type="text"
              value={keyForm.name}
              onChange={(e) => setKeyForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="e.g., Production API Key"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              A descriptive name to identify this key
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permissions
            </label>
            <div className="space-y-3">
              {PERMISSION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    keyForm.permissions.includes(option.value)
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={keyForm.permissions.includes(option.value)}
                    onChange={() => handlePermissionToggle(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={keyForm.expires_at}
              onChange={(e) => setKeyForm(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Leave empty for no expiration
            </p>
          </div>
        </div>
      </DetailsSidebar>

      {/* Show New Key Result */}
      <DetailsSidebar
        isOpen={!!newKeyResult}
        onClose={() => {
          setNewKeyResult(null);
          setShowCreateKey(false);
        }}
        title="API Key Created"
        subtitle="Copy your key now - it won't be shown again!"
        width="lg"
        footer={
          <button
            onClick={() => {
              setNewKeyResult(null);
              setShowCreateKey(false);
            }}
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Done
          </button>
        }
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-success-50 border border-success-200 p-4 dark:bg-success-500/10 dark:border-success-500/30">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-success-800 dark:text-success-300">
                Your API key &quot;{newKeyResult?.name}&quot; has been created!
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-error-50 border border-error-200 p-4 dark:bg-error-500/10 dark:border-error-500/30">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-error-800 dark:text-error-300">Important: Copy your key now!</p>
                <p className="text-sm text-error-700 dark:text-error-400 mt-1">
                  This is the only time your full API key will be displayed. Store it securely.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-200 break-all">
                {newKeyResult?.full_key}
              </code>
              <button
                onClick={handleCopyKey}
                className={`flex-shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  copied
                    ? "bg-success-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </DetailsSidebar>
    </>
  );
};

export default ApiKeysSettings;
