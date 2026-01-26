"use client";
import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

interface Attachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "message" | "email";
}

const recipients = [
  { value: "alex", label: "Alex Johnson", email: "alex@company.com" },
  { value: "sarah", label: "Sarah Williams", email: "sarah@company.com" },
  { value: "michael", label: "Michael Chen", email: "michael@company.com" },
  { value: "emily", label: "Emily Davis", email: "emily@company.com" },
  { value: "james", label: "James Wilson", email: "james@company.com" },
  { value: "lisa", label: "Lisa Thompson", email: "lisa@company.com" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "project", label: "Project" },
  { value: "client", label: "Client" },
  { value: "team", label: "Team" },
  { value: "other", label: "Other" },
];

export function ComposeMessageModal({ isOpen, onClose, type = "message" }: ComposeMessageModalProps) {
  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    subject: "",
    message: "",
    priority: "normal",
    category: "general",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const fileNames = files.map((f) => f.name);
    setUploadingFiles((prev) => [...prev, ...fileNames]);

    try {
      // Upload each file to Cloudinary
      for (const file of files) {
        const base64 = await convertToBase64(file);

        const response = await fetch("/api/upload/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAttachments((prev) => [...prev, data]);
        } else {
          console.error("Failed to upload:", file.name);
        }

        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingFiles([]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Prepare message data with attachment URLs
    const messageData = {
      ...formData,
      attachments: attachments.map((a) => ({
        url: a.url,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
      })),
    };

    console.log("Message data:", messageData);

    // TODO: Send to API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSending(false);
    onClose();

    // Reset form
    setFormData({
      to: "",
      cc: "",
      subject: "",
      message: "",
      priority: "normal",
      category: "general",
    });
    setAttachments([]);
  };

  const isEmail = type === "email";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEmail ? "Compose Email" : "New Message"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEmail ? "Send an email to external recipients" : "Send a message to your team"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="to">To *</Label>
            {isEmail ? (
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              />
            ) : (
              <select
                id="to"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Select recipient</option>
                {recipients.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          {!isEmail && (
            <>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {isEmail && (
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showOptionalFields ? "Hide" : "Show"} CC/BCC fields
          </button>
        )}

        {isEmail && showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-4">
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={formData.cc}
                  onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="message">Message *</Label>
          <textarea
            id="message"
            rows={6}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            placeholder="Write your message..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        {(attachments.length > 0 || uploadingFiles.length > 0) && (
          <div>
            <Label>Attachments</Label>
            <div className="mt-2 space-y-2">
              {/* Uploading files */}
              {uploadingFiles.map((fileName) => (
                <div
                  key={fileName}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
                      <span className="block text-xs text-brand-500">Uploading...</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Uploaded files */}
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                      {file.fileType?.startsWith("image/") ? (
                        <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.fileName}</span>
                      <span className="block text-xs text-gray-500">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
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

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className={`cursor-pointer ${uploadingFiles.length > 0 ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {uploadingFiles.length > 0 ? "Uploading..." : "Attach files"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || uploadingFiles.length > 0 || !formData.to || !formData.subject || !formData.message}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSending ? "Sending..." : isEmail ? "Send Email" : "Send Message"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
