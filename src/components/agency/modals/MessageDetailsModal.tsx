"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Message } from "../MessagesTable";

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

export const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  if (!message) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "normal":
        return "primary";
      case "low":
        return "warning";
      default:
        return "primary";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "project":
        return "primary";
      case "client":
        return "success";
      case "team":
        return "warning";
      default:
        return "light";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {message.subject}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {message.time} • {message.date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              size="sm"
              color={getCategoryColor(message.category) as "success" | "warning" | "error" | "primary" | "light"}
            >
              {message.category.charAt(0).toUpperCase() + message.category.slice(1)}
            </Badge>
            <Badge
              size="sm"
              color={getPriorityColor(message.priority) as "success" | "warning" | "error" | "primary"}
            >
              {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold dark:bg-gray-800 dark:text-gray-400">
            {message.from.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {message.from}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To: {message.to}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Close
        </button>
        <button
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Reply
        </button>
      </div>
    </Modal>
  );
};
