"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { ComposeMessageModal, MessageDetailsModal } from "./modals";

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  time: string;
  date: string;
  unread: boolean;
  priority: "low" | "normal" | "high";
  category: "general" | "project" | "client" | "team" | "other";
}

const mockMessages: Message[] = [
  {
    id: "1",
    from: "Sarah Johnson",
    to: "You",
    subject: "Project Update - Website Redesign",
    preview: "Hi team, I wanted to share the latest progress on the website redesign project...",
    content: "Hi team,\n\nI wanted to share the latest progress on the website redesign project. We've completed the initial mockups and are ready for review.\n\nPlease take a look and let me know your thoughts.\n\nBest,\nSarah",
    time: "10:30 AM",
    date: "Today",
    unread: true,
    priority: "high",
    category: "project",
  },
  {
    id: "2",
    from: "Michael Chen",
    to: "You",
    subject: "Re: API Documentation",
    preview: "Thanks for the feedback. I've made the updates you suggested and...",
    content: "Thanks for the feedback. I've made the updates you suggested and pushed the changes to the repository.\n\nLet me know if you need anything else.\n\nMichael",
    time: "9:45 AM",
    date: "Today",
    unread: true,
    priority: "normal",
    category: "project",
  },
  {
    id: "3",
    from: "Emily Davis",
    to: "You",
    subject: "Meeting Tomorrow",
    preview: "Just a reminder about our meeting tomorrow at 2 PM. Please come prepared with...",
    content: "Just a reminder about our meeting tomorrow at 2 PM. Please come prepared with your updates on the current sprint.\n\nSee you then!\nEmily",
    time: "4:30 PM",
    date: "Yesterday",
    unread: false,
    priority: "normal",
    category: "team",
  },
  {
    id: "4",
    from: "James Wilson",
    to: "You",
    subject: "Marketing Campaign Assets",
    preview: "I've uploaded all the marketing assets to the shared folder. Let me know if you need...",
    content: "I've uploaded all the marketing assets to the shared folder. Let me know if you need any modifications or additional formats.\n\nJames",
    time: "2:15 PM",
    date: "Yesterday",
    unread: false,
    priority: "low",
    category: "general",
  },
  {
    id: "5",
    from: "Lisa Thompson",
    to: "You",
    subject: "Client Feedback - Acme Corp",
    preview: "Great news! The client has approved the final designs. They mentioned...",
    content: "Great news! The client has approved the final designs. They mentioned they're very happy with the direction we took.\n\nLet's schedule a call to discuss next steps.\n\nLisa",
    time: "11:00 AM",
    date: "Jan 23",
    unread: false,
    priority: "high",
    category: "client",
  },
];

export const MessagesTable = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = messages.filter((m) => m.unread).length;
  const filteredMessages = filter === "unread"
    ? messages.filter((m) => m.unread)
    : messages;

  const handleViewMessage = (message: Message) => {
    setViewingMessage(message);
    // Mark as read
    setMessages(messages.map((m) =>
      m.id === message.id ? { ...m, unread: false } : m
    ));
  };

  const handleComposeMessage = () => {
    setIsModalOpen(true);
  };

  const handleDeleteMessage = (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }
    setMessages(messages.filter((m) => m.id !== id));
  };

  const handleMarkAllRead = () => {
    setMessages(messages.map((m) => ({ ...m, unread: false })));
  };

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
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Messages
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {messages.length} messages • {unreadCount} unread
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  filter === "all"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  filter === "unread"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={handleComposeMessage}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Message
            </button>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No messages
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === "unread" ? "No unread messages." : "Start a conversation by sending a message."}
            </p>
            <button
              onClick={handleComposeMessage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              New Message
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    From
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Subject
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Priority
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMessages.map((message) => (
                  <TableRow key={message.id} className={message.unread ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        {message.unread && (
                          <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold text-sm dark:bg-gray-800 dark:text-gray-400">
                          {message.from.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className={`text-theme-sm ${message.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {message.from}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <button
                          onClick={() => handleViewMessage(message)}
                          className={`text-theme-sm text-left hover:text-brand-500 dark:hover:text-brand-400 ${message.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {message.subject}
                        </button>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {message.preview}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getCategoryColor(message.category) as "success" | "warning" | "error" | "primary" | "light"}
                      >
                        {message.category.charAt(0).toUpperCase() + message.category.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getPriorityColor(message.priority) as "success" | "warning" | "error" | "primary"}
                      >
                        {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div>
                        <span className="block">{message.time}</span>
                        <span className="text-theme-xs">{message.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewMessage(message)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-error-500 hover:text-error-600"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ComposeMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="message"
      />

      <MessageDetailsModal
        isOpen={!!viewingMessage}
        onClose={() => setViewingMessage(null)}
        message={viewingMessage}
      />
    </>
  );
};
