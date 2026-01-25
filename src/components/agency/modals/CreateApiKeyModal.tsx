"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const keyTypes = [
  { value: "production", label: "Production" },
  { value: "development", label: "Development" },
  { value: "webhook", label: "Webhook Secret" },
];

const permissions = [
  { id: "read", label: "Read data" },
  { id: "write", label: "Write data" },
  { id: "delete", label: "Delete data" },
  { id: "admin", label: "Admin access" },
];

export function CreateApiKeyModal({ isOpen, onClose }: CreateApiKeyModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "development",
    expiryDays: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["read"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate key generation
    const prefix = formData.type === "production" ? "sk_live_" : formData.type === "development" ? "sk_test_" : "whsec_";
    const key = prefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setGeneratedKey(key);
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setFormData({ name: "", type: "development", expiryDays: "" });
    setSelectedPermissions(["read"]);
    onClose();
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {generatedKey ? "API Key Created" : "Create API Key"}
        </h2>

        {generatedKey ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
              <p className="text-sm text-warning-700 dark:text-warning-400">
                <strong>Important:</strong> This is the only time you&apos;ll see this key. Copy it now and store it securely.
              </p>
            </div>

            <div>
              <Label>Your API Key</Label>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                  {generatedKey}
                </code>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyType">Key Type</Label>
                <Select
                  options={keyTypes}
                  defaultValue={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value })}
                />
              </div>

              <div>
                <Label htmlFor="expiryDays">Expiry (Days)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  placeholder="Never (leave blank)"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.type === "production" && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
                <p className="text-sm text-warning-700 dark:text-warning-400">
                  Production keys have access to live data. Handle with care and never expose in client-side code.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Key
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
