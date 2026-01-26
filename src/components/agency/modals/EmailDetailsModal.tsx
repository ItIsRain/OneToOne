"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Email } from "../EmailsTable";

interface EmailDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: Email | null;
}

export const EmailDetailsModal: React.FC<EmailDetailsModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  if (!email) return null;

  const getLabelColor = (label: string) => {
    switch (label) {
      case "important":
        return "error";
      case "client":
        return "success";
      case "events":
        return "primary";
      case "billing":
        return "warning";
      default:
        return "light";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                className={`text-xl ${email.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"}`}
              >
                ★
              </button>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {email.subject}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {email.time} • {email.date}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {email.labels.map((label) => (
              <Badge
                key={label}
                size="sm"
                color={getLabelColor(label) as "success" | "warning" | "error" | "primary" | "light"}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12">From:</span>
            <span className="text-sm text-gray-900 dark:text-white">{email.from}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12">To:</span>
            <span className="text-sm text-gray-900 dark:text-white">{email.to}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {email.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1">
            <span>📎</span> Attach
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Forward
          </button>
          <button
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Reply
          </button>
        </div>
      </div>
    </Modal>
  );
};
