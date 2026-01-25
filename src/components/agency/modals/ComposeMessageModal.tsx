"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "message" | "email";
}

const recipients = [
  { value: "alex", label: "Alex Johnson" },
  { value: "sarah", label: "Sarah Williams" },
  { value: "michael", label: "Michael Chen" },
  { value: "emily", label: "Emily Davis" },
  { value: "james", label: "James Wilson" },
  { value: "lisa", label: "Lisa Thompson" },
];

export function ComposeMessageModal({ isOpen, onClose, type = "message" }: ComposeMessageModalProps) {
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    subject: "",
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Message data:", { ...formData, attachments });
    onClose();
  };

  const isEmail = type === "email";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {isEmail ? "Compose Email" : "New Message"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="to">To</Label>
            {isEmail ? (
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              />
            ) : (
              <Select
                options={recipients}
                defaultValue={formData.to}
                onChange={(value) => setFormData({ ...formData, to: value })}
                placeholder="Select recipient"
              />
            )}
          </div>

          {isEmail && (
            <div>
              <Label htmlFor="cc">CC (optional)</Label>
              <Input
                id="cc"
                type="email"
                placeholder="cc@example.com"
                value={formData.cc}
                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              rows={8}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Write your message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          {attachments.length > 0 && (
            <div>
              <Label>Attachments</Label>
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📎</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-error-500 hover:text-error-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500">
                <span>📎</span>
                Attach files
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                {isEmail ? "Send Email" : "Send Message"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
