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
import { ComposeMessageModal, EmailDetailsModal } from "./modals";

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  time: string;
  date: string;
  unread: boolean;
  starred: boolean;
  folder: "inbox" | "sent" | "drafts" | "archive" | "trash";
  labels: string[];
}

const mockEmails: Email[] = [
  {
    id: "1",
    from: "john@acmecorp.com",
    to: "you@company.com",
    subject: "Re: Contract Renewal",
    preview: "Thank you for sending over the contract. We've reviewed it and have a few questions...",
    content: "Thank you for sending over the contract. We've reviewed it and have a few questions regarding the terms.\n\nCould we schedule a call to discuss?\n\nBest,\nJohn",
    time: "11:20 AM",
    date: "Today",
    unread: true,
    starred: true,
    folder: "inbox",
    labels: ["important", "client"],
  },
  {
    id: "2",
    from: "marketing@techstart.io",
    to: "you@company.com",
    subject: "Product Launch Invitation",
    preview: "You're invited to the exclusive launch event of our new product line...",
    content: "You're invited to the exclusive launch event of our new product line.\n\nDate: February 15, 2025\nTime: 6:00 PM\nVenue: Grand Ballroom\n\nRSVP by February 10th.",
    time: "10:15 AM",
    date: "Today",
    unread: true,
    starred: false,
    folder: "inbox",
    labels: ["events"],
  },
  {
    id: "3",
    from: "support@software.com",
    to: "you@company.com",
    subject: "Your subscription is expiring",
    preview: "Your annual subscription will expire in 7 days. Renew now to avoid...",
    content: "Your annual subscription will expire in 7 days. Renew now to avoid any service interruption.\n\nClick here to renew: [Renew Now]\n\nThank you for being a valued customer.",
    time: "9:30 AM",
    date: "Today",
    unread: false,
    starred: false,
    folder: "inbox",
    labels: ["billing"],
  },
  {
    id: "4",
    from: "events@venue.com",
    to: "you@company.com",
    subject: "Booking Confirmation #2847",
    preview: "Your venue booking has been confirmed. Here are the details...",
    content: "Your venue booking has been confirmed.\n\nBooking ID: #2847\nDate: March 20, 2025\nVenue: Conference Hall A\nTime: 9:00 AM - 5:00 PM\n\nPlease contact us if you need any changes.",
    time: "3:45 PM",
    date: "Yesterday",
    unread: false,
    starred: true,
    folder: "inbox",
    labels: ["events", "important"],
  },
  {
    id: "5",
    from: "newsletter@industry.com",
    to: "you@company.com",
    subject: "Weekly Industry Digest",
    preview: "This week's top stories in the events industry...",
    content: "This week's top stories in the events industry:\n\n1. Virtual events continue to grow\n2. New sustainability trends\n3. Technology innovations in event management\n\nRead more at our website.",
    time: "8:00 AM",
    date: "Yesterday",
    unread: false,
    starred: false,
    folder: "inbox",
    labels: ["newsletter"],
  },
];

export const EmailsTable = () => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<Email | null>(null);
  const [currentFolder, setCurrentFolder] = useState<"inbox" | "sent" | "drafts" | "starred" | "archive" | "trash">("inbox");

  const unreadCount = emails.filter((e) => e.unread && e.folder === "inbox").length;
  const starredCount = emails.filter((e) => e.starred).length;

  const filteredEmails = currentFolder === "starred"
    ? emails.filter((e) => e.starred)
    : emails.filter((e) => e.folder === currentFolder);

  const handleViewEmail = (email: Email) => {
    setViewingEmail(email);
    setEmails(emails.map((e) =>
      e.id === email.id ? { ...e, unread: false } : e
    ));
  };

  const handleComposeEmail = () => {
    setIsModalOpen(true);
  };

  const handleDeleteEmail = (id: string) => {
    if (!confirm("Are you sure you want to delete this email?")) {
      return;
    }
    setEmails(emails.map((e) =>
      e.id === id ? { ...e, folder: "trash" as const } : e
    ));
  };

  const handleToggleStar = (id: string) => {
    setEmails(emails.map((e) =>
      e.id === id ? { ...e, starred: !e.starred } : e
    ));
  };

  const handleArchiveEmail = (id: string) => {
    setEmails(emails.map((e) =>
      e.id === id ? { ...e, folder: "archive" as const } : e
    ));
  };

  const folders = [
    { id: "inbox", label: "Inbox", count: unreadCount },
    { id: "sent", label: "Sent", count: 0 },
    { id: "drafts", label: "Drafts", count: 0 },
    { id: "starred", label: "Starred", count: starredCount },
    { id: "archive", label: "Archive", count: 0 },
    { id: "trash", label: "Trash", count: 0 },
  ];

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
    <>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <button
              onClick={handleComposeEmail}
              className="w-full mb-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
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
              Compose
            </button>

            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id as typeof currentFolder)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    currentFolder === folder.id
                      ? "bg-brand-50 text-brand-600 font-medium dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{folder.label}</span>
                  {folder.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      currentFolder === folder.id
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {folders.find((f) => f.id === currentFolder)?.label || "Inbox"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredEmails.length} emails
                {currentFolder === "inbox" && unreadCount > 0 && ` • ${unreadCount} unread`}
              </p>
            </div>

            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={handleComposeEmail}
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
                Compose
              </button>
            </div>
          </div>

          {filteredEmails.length === 0 ? (
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No emails
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your {currentFolder} folder is empty.
              </p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-10"
                    >
                      {" "}
                    </TableCell>
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
                      Labels
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
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id} className={email.unread ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}>
                      <TableCell className="py-3">
                        <button
                          onClick={() => handleToggleStar(email.id)}
                          className={`text-xl ${email.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500 dark:text-gray-600"}`}
                        >
                          ★
                        </button>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {email.unread && (
                            <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                          )}
                          <span className={`text-theme-sm ${email.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {email.from}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <button
                            onClick={() => handleViewEmail(email)}
                            className={`text-theme-sm text-left hover:text-brand-500 dark:hover:text-brand-400 ${email.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                          >
                            {email.subject}
                          </button>
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {email.preview}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {email.labels.slice(0, 2).map((label) => (
                            <Badge
                              key={label}
                              size="sm"
                              color={getLabelColor(label) as "success" | "warning" | "error" | "primary" | "light"}
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div>
                          <span className="block">{email.time}</span>
                          <span className="text-theme-xs">{email.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewEmail(email)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleArchiveEmail(email.id)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => handleDeleteEmail(email.id)}
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
      </div>

      <ComposeMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="email"
      />

      <EmailDetailsModal
        isOpen={!!viewingEmail}
        onClose={() => setViewingEmail(null)}
        email={viewingEmail}
      />
    </>
  );
};
