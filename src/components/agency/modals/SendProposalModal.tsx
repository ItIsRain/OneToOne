"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

interface SendProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  proposalSlug: string;
  onSent: () => void;
}

export const SendProposalModal: React.FC<SendProposalModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  proposalSlug,
  onSent,
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const publicLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/proposal/${proposalSlug}`
      : `/proposal/${proposalSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = publicLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setError("");

    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send proposal");
      }

      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send proposal");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Send Proposal
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Share this proposal with your client
        </p>
      </div>

      <div className="space-y-5">
        {/* Public Link */}
        <div>
          <Label>Public Link</Label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="h-11 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="send-message">Message (Optional)</Label>
          <textarea
            id="send-message"
            placeholder="Add a personal message to include in the email..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send Proposal"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SendProposalModal;
