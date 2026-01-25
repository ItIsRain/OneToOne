"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const files = [
  { value: "project-brief", label: "Project Brief - Website Redesign.pdf" },
  { value: "event-schedule", label: "Event Schedule - Annual Gala.xlsx" },
  { value: "brand-assets", label: "Brand Assets.zip" },
  { value: "q1-report", label: "Q1 Report Preview.pdf" },
  { value: "meeting-recording", label: "Meeting Recording.mp4" },
];

const clients = [
  { value: "acme", label: "Acme Corporation" },
  { value: "techstart", label: "TechStart Inc." },
  { value: "globaltech", label: "GlobalTech Solutions" },
  { value: "metro", label: "Metro Events" },
  { value: "creative", label: "Creative Co." },
];

const permissions = [
  { value: "view", label: "View Only" },
  { value: "download", label: "View & Download" },
  { value: "edit", label: "View, Download & Edit" },
];

export function ShareFileModal({ isOpen, onClose }: ShareFileModalProps) {
  const [formData, setFormData] = useState({
    file: "",
    permission: "view",
    expiryDate: "",
    password: "",
    message: "",
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const toggleRecipient = (value: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const addEmailRecipient = () => {
    if (emailInput && emailInput.includes("@")) {
      setSelectedRecipients((prev) => [...prev, emailInput]);
      setEmailInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Share data:", { ...formData, recipients: selectedRecipients });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Share File
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Select
              options={files}
              defaultValue={formData.file}
              onChange={(value) => setFormData({ ...formData, file: value })}
              placeholder="Choose a file to share"
            />
          </div>

          <div>
            <Label>Share With</Label>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRecipients.map((recipient) => (
                  <span
                    key={recipient}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-sm dark:bg-brand-500/20 dark:text-brand-400"
                  >
                    {recipient.includes("@") ? recipient : clients.find((c) => c.value === recipient)?.label}
                    <button
                      type="button"
                      onClick={() => toggleRecipient(recipient)}
                      className="ml-1 hover:text-brand-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {clients.map((client) => (
                  <label
                    key={client.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(client.value)}
                      onChange={() => toggleRecipient(client.value)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {client.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="permission">Permission Level</Label>
              <Select
                options={permissions}
                defaultValue={formData.permission}
                onChange={(value) => setFormData({ ...formData, permission: value })}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Link Expiry (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password Protection (Optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Set a password for this share"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

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

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedRecipients.length === 0}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share File
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
