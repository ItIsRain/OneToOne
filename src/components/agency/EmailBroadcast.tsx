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
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: "client" | "team" | "lead";
  selected: boolean;
}

interface BroadcastHistory {
  id: string;
  subject: string;
  recipientCount: number;
  sentAt: string;
  status: "sent" | "scheduled" | "draft";
  openRate?: number;
  template?: string;
}

const mockRecipients: Recipient[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@acmecorp.com", type: "client", selected: false },
  { id: "2", name: "Michael Chen", email: "michael@techstart.io", type: "client", selected: false },
  { id: "3", name: "Emily Davis", email: "emily@company.com", type: "team", selected: false },
  { id: "4", name: "James Wilson", email: "james@company.com", type: "team", selected: false },
  { id: "5", name: "Lisa Thompson", email: "lisa@innovate.co", type: "client", selected: false },
  { id: "6", name: "David Park", email: "david@growthlabs.com", type: "lead", selected: false },
  { id: "7", name: "Anna Martinez", email: "anna@enterprise.com", type: "client", selected: false },
  { id: "8", name: "Robert Brown", email: "robert@company.com", type: "team", selected: false },
];

const mockHistory: BroadcastHistory[] = [
  {
    id: "1",
    subject: "Annual Gala Event Invitation",
    recipientCount: 156,
    sentAt: "Jan 25, 2025 at 10:30 AM",
    status: "sent",
    openRate: 68,
    template: "event",
  },
  {
    id: "2",
    subject: "Product Launch Announcement",
    recipientCount: 89,
    sentAt: "Jan 20, 2025 at 2:00 PM",
    status: "sent",
    openRate: 72,
    template: "announcement",
  },
  {
    id: "3",
    subject: "Q1 Newsletter",
    recipientCount: 234,
    sentAt: "Scheduled for Feb 1, 2025",
    status: "scheduled",
    template: "newsletter",
  },
  {
    id: "4",
    subject: "Workshop Registration Open",
    recipientCount: 0,
    sentAt: "Draft",
    status: "draft",
    template: "event",
  },
];

const emailTemplates = [
  { id: "blank", name: "Blank Email", description: "Start from scratch" },
  { id: "event", name: "Event Invitation", description: "Invite recipients to an event" },
  { id: "announcement", name: "Announcement", description: "Share important news" },
  { id: "newsletter", name: "Newsletter", description: "Regular updates and content" },
  { id: "reminder", name: "Reminder", description: "Send a reminder about something" },
  { id: "followup", name: "Follow-up", description: "Follow up after a meeting or event" },
];

export const EmailBroadcast = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>(mockRecipients);
  const [history] = useState<BroadcastHistory[]>(mockHistory);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "clients" | "team" | "leads">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    template: "",
    subject: "",
    preheader: "",
    content: "",
    eventName: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    ctaText: "",
    ctaUrl: "",
  });

  const selectedCount = recipients.filter((r) => r.selected).length;
  const totalSent = history.filter((h) => h.status === "sent").reduce((acc, h) => acc + h.recipientCount, 0);

  const filteredRecipients = recipients.filter((r) => {
    const matchesFilter = recipientFilter === "all" || r.type === recipientFilter.slice(0, -1);
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setRecipients(recipients.map((r) => {
      const matchesFilter = recipientFilter === "all" || r.type === recipientFilter.slice(0, -1);
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (matchesFilter && matchesSearch) {
        return { ...r, selected: newSelectAll };
      }
      return r;
    }));
  };

  const handleToggleRecipient = (id: string) => {
    setRecipients(recipients.map((r) =>
      r.id === id ? { ...r, selected: !r.selected } : r
    ));
  };

  const handleOpenModal = () => {
    setCurrentStep(1);
    setFormData({
      template: "",
      subject: "",
      preheader: "",
      content: "",
      eventName: "",
      eventDate: "",
      eventTime: "",
      eventLocation: "",
      ctaText: "",
      ctaUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    setFormData({ ...formData, template: templateId });
    setCurrentStep(2);
  };

  const handleSendBroadcast = () => {
    console.log("Sending broadcast:", {
      recipients: recipients.filter((r) => r.selected),
      ...formData,
    });
    setIsModalOpen(false);
    // Reset selections
    setRecipients(recipients.map((r) => ({ ...r, selected: false })));
    setSelectAll(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "success";
      case "scheduled":
        return "warning";
      case "draft":
        return "light";
      default:
        return "primary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "client":
        return "success";
      case "team":
        return "primary";
      case "lead":
        return "warning";
      default:
        return "light";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
              <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSent}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 dark:bg-success-500/20">
              <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{recipients.length}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-500/20">
              <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Open Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">70%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recipients Selection */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recipients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} of {recipients.length} selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-48 rounded-lg border border-gray-300 bg-transparent pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              {["all", "clients", "team", "leads"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRecipientFilter(filter as typeof recipientFilter)}
                  className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                    recipientFilter === filter
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenModal}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Broadcast
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-10"
                >
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Type
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRecipients.map((recipient) => (
                <TableRow key={recipient.id} className={recipient.selected ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}>
                  <TableCell className="py-3">
                    <input
                      type="checkbox"
                      checked={recipient.selected}
                      onChange={() => handleToggleRecipient(recipient.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold text-sm dark:bg-gray-800 dark:text-gray-400">
                        {recipient.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white text-theme-sm">
                        {recipient.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {recipient.email}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      size="sm"
                      color={getTypeColor(recipient.type) as "success" | "warning" | "primary" | "light"}
                    >
                      {recipient.type.charAt(0).toUpperCase() + recipient.type.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Broadcast History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {history.length} broadcasts
            </p>
          </div>
        </div>

        {history.length === 0 ? (
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
              No broadcasts yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Send your first broadcast email to get started.
            </p>
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
                    Subject
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Recipients
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Open Rate
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Sent
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
                {history.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-theme-sm">
                          {broadcast.subject}
                        </p>
                        {broadcast.template && (
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            Template: {broadcast.template}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300">
                      {broadcast.recipientCount > 0 ? broadcast.recipientCount : "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getStatusColor(broadcast.status) as "success" | "warning" | "light"}
                      >
                        {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300">
                      {broadcast.openRate ? `${broadcast.openRate}%` : "-"}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {broadcast.sentAt}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          View
                        </button>
                        {broadcast.status === "draft" && (
                          <button className="text-brand-500 hover:text-brand-600">
                            Edit
                          </button>
                        )}
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          Duplicate
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

      {/* Compose Broadcast Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-3xl p-6 lg:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {currentStep === 1 ? "Choose a Template" : "Compose Broadcast"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentStep === 1
              ? "Select a template to get started"
              : `Sending to ${selectedCount} recipient${selectedCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= 1 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= 2 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`}>
            2
          </div>
        </div>

        {currentStep === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            {emailTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-left hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    {template.id === "blank" && (
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {template.id === "event" && (
                      <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {template.id === "announcement" && (
                      <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    )}
                    {template.id === "newsletter" && (
                      <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    )}
                    {template.id === "reminder" && (
                      <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {template.id === "followup" && (
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSendBroadcast(); }} className="space-y-5 max-h-[50vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="preheader">Preview Text</Label>
                <Input
                  id="preheader"
                  placeholder="Brief preview shown in inbox"
                  value={formData.preheader}
                  onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">This appears next to the subject in most email clients</p>
              </div>

              {formData.template === "event" && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Event Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input
                        id="eventName"
                        placeholder="Annual Gala 2025"
                        value={formData.eventName}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventLocation">Location</Label>
                      <Input
                        id="eventLocation"
                        placeholder="Grand Ballroom, City Hotel"
                        value={formData.eventLocation}
                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventDate">Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime">Time</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={formData.eventTime}
                        onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="content">Email Content *</Label>
                <textarea
                  id="content"
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Write your email content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    placeholder="RSVP Now"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ctaUrl">Button Link</Label>
                  <Input
                    id="ctaUrl"
                    placeholder="https://..."
                    value={formData.ctaUrl}
                    onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to templates
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={!formData.subject || !formData.content}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                >
                  Send to {selectedCount} Recipients
                </button>
              </div>
            </div>
          </form>
        )}

        {currentStep === 1 && (
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};
