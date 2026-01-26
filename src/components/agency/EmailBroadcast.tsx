"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  event_type: string;
  is_virtual: boolean;
  virtual_link: string | null;
  venue?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  job_title: string | null;
  status: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  status: string;
  email_opt_in: boolean;
  do_not_contact: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: "client" | "team" | "lead" | "contact";
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

interface Attachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

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
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientFilter, setRecipientFilter] = useState<"all" | "clients" | "contacts" | "team" | "leads">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    template: "",
    subject: "",
    preheader: "",
    content: "",
    selectedEventId: "",
    ctaText: "",
    ctaUrl: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [broadcastStats, setBroadcastStats] = useState({ totalSent: 0, totalBroadcasts: 0 });
  const [isSending, setIsSending] = useState(false);

  // Fetch broadcast history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/email/broadcast");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.broadcasts || []);
        setBroadcastStats(data.stats || { totalSent: 0, totalBroadcasts: 0 });
      }
    } catch (error) {
      console.error("Error fetching broadcast history:", error);
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, teamRes, leadsRes, contactsRes, eventsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/team/members"),
        fetch("/api/leads"),
        fetch("/api/contacts"),
        fetch("/api/events"),
      ]);

      // Also fetch broadcast history
      fetchHistory();

      const recipientsList: Recipient[] = [];

      // Process clients
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        const clients: Client[] = clientsData.clients || [];
        clients.forEach((client) => {
          if (client.email && client.status === "active") {
            recipientsList.push({
              id: `client-${client.id}`,
              name: client.name,
              email: client.email,
              type: "client",
              selected: false,
            });
          }
        });
      }

      // Process team members
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        const members: TeamMember[] = teamData.members || [];
        members.forEach((member) => {
          if (member.email && member.status !== "inactive") {
            recipientsList.push({
              id: `team-${member.id}`,
              name: `${member.first_name}${member.last_name ? ` ${member.last_name}` : ""}`,
              email: member.email,
              type: "team",
              selected: false,
            });
          }
        });
      }

      // Process leads
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const leads: Lead[] = leadsData.leads || [];
        leads.forEach((lead) => {
          if (lead.email) {
            recipientsList.push({
              id: `lead-${lead.id}`,
              name: lead.name,
              email: lead.email,
              type: "lead",
              selected: false,
            });
          }
        });
      }

      // Process contacts
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        const contacts: Contact[] = contactsData.contacts || [];
        contacts.forEach((contact) => {
          // Only include contacts with email, who opted in, and are not on do-not-contact list
          if (contact.email && contact.email_opt_in && !contact.do_not_contact && contact.status === "active") {
            recipientsList.push({
              id: `contact-${contact.id}`,
              name: `${contact.first_name} ${contact.last_name}`.trim(),
              email: contact.email,
              type: "contact",
              selected: false,
            });
          }
        });
      }

      // Process events
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData || []);
      }

      setRecipients(recipientsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedCount = recipients.filter((r) => r.selected).length;
  const totalSent = broadcastStats.totalSent;

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
      selectedEventId: "",
      ctaText: "",
      ctaUrl: "",
    });
    setAttachments([]);
    setUploadingFiles([]);
    setIsModalOpen(true);
  };

  // File upload helpers
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
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to upload:", file.name, errorData.error || response.statusText);
          alert(`Failed to upload ${file.name}: ${errorData.error || "Unknown error"}`);
        }

        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setUploadingFiles([]);
    }

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

  const handleSelectTemplate = (templateId: string) => {
    let templateContent = "";
    let templateSubject = "";
    let templatePreheader = "";

    switch (templateId) {
      case "announcement":
        templateSubject = "Important Announcement";
        templatePreheader = "We have some exciting news to share with you";
        templateContent = `Dear {{name}},\n\nWe have an important announcement to share with you.\n\n[Your announcement content here]\n\nThank you for your continued support.\n\nBest regards,\nThe Team`;
        break;
      case "newsletter":
        templateSubject = "Monthly Newsletter";
        templatePreheader = "Your monthly update is here";
        templateContent = `Hi {{name}},\n\nWelcome to this month's newsletter!\n\n📰 What's New\n[Share your updates here]\n\n🎯 Upcoming Events\n[List upcoming events]\n\n💡 Tips & Resources\n[Share helpful content]\n\nStay connected,\nThe Team`;
        break;
      case "reminder":
        templateSubject = "Friendly Reminder";
        templatePreheader = "Don't forget about this important reminder";
        templateContent = `Hi {{name}},\n\nThis is a friendly reminder about [topic].\n\n📅 When: [Date/Time]\n📍 Where: [Location/Link]\n\nPlease let us know if you have any questions.\n\nBest regards,\nThe Team`;
        break;
      case "followup":
        templateSubject = "Following Up";
        templatePreheader = "We wanted to follow up with you";
        templateContent = `Hi {{name}},\n\nThank you for [meeting/attending/etc.]. We wanted to follow up and [share next steps/get your feedback/etc.].\n\n[Your follow-up content here]\n\nLooking forward to hearing from you.\n\nBest regards,\nThe Team`;
        break;
      default:
        // Blank template
        templateContent = `Dear {{name}},\n\n[Your message here]\n\nBest regards,\nThe Team`;
        break;
    }

    setFormData({
      ...formData,
      template: templateId,
      subject: templateSubject,
      preheader: templatePreheader,
      content: templateContent,
    });
    setCurrentStep(2);
  };

  const handleSelectEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      const eventDate = new Date(event.start_date);
      const formattedDate = eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = event.start_time || eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const location = event.is_virtual
        ? `Virtual Event${event.virtual_link ? ` - ${event.virtual_link}` : ""}`
        : event.venue
          ? `${event.venue.name}${event.venue.address ? `, ${event.venue.address}` : ""}${event.venue.city ? `, ${event.venue.city}` : ""}`
          : event.location || "TBA";

      setFormData({
        ...formData,
        selectedEventId: eventId,
        subject: `You're Invited: ${event.title}`,
        preheader: `Join us for ${event.title} on ${formattedDate}`,
        content: `Dear {{name}},\n\nWe are excited to invite you to ${event.title}!\n\n📅 Date: ${formattedDate}\n⏰ Time: ${formattedTime}\n📍 Location: ${location}\n\n${event.description || "We look forward to seeing you there!"}\n\nBest regards,\nThe Team`,
        ctaText: "RSVP Now",
        ctaUrl: "",
      });
    }
  };

  // Helper function to replace template variables with recipient data
  const personalizeContent = (content: string, recipient: Recipient) => {
    return content
      .replace(/\{\{name\}\}/gi, recipient.name)
      .replace(/\{\{email\}\}/gi, recipient.email)
      .replace(/\{\{first_name\}\}/gi, recipient.name.split(" ")[0])
      .replace(/\{\{type\}\}/gi, recipient.type);
  };

  const handleSendBroadcast = async () => {
    const selectedRecipients = recipients.filter((r) => r.selected);

    if (selectedRecipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    setIsSending(true);

    try {
      // Prepare personalized emails for each recipient
      const recipientsPayload = selectedRecipients.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
        type: recipient.type,
        id: recipient.id.replace(/^(client|team|lead|contact)-/, ""),
        personalizedSubject: personalizeContent(formData.subject, recipient),
        personalizedContent: personalizeContent(formData.content, recipient),
      }));

      const response = await fetch("/api/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formData.subject,
          preheader: formData.preheader,
          content: formData.content,
          template: formData.template,
          ctaText: formData.ctaText,
          ctaUrl: formData.ctaUrl,
          attachments: attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize,
          })),
          recipients: recipientsPayload,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Broadcast sent successfully! ${data.sentCount} of ${data.totalRecipients} emails delivered.`);
        setIsModalOpen(false);
        // Reset selections
        setRecipients(recipients.map((r) => ({ ...r, selected: false })));
        setSelectAll(false);
        setAttachments([]);
        // Refresh history
        fetchHistory();
      } else {
        alert(`Failed to send broadcast: ${data.error}`);
      }
    } catch (error) {
      console.error("Send broadcast error:", error);
      alert("Failed to send broadcast. Please try again.");
    } finally {
      setIsSending(false);
    }
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
      case "contact":
        return "info";
      default:
        return "light";
    }
  };

  const selectedEvent = events.find((e) => e.id === formData.selectedEventId);
  const upcomingEvents = events.filter((e) => {
    const eventDate = new Date(e.start_date);
    return eventDate >= new Date() && e.status !== "cancelled";
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/20">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Broadcasts Sent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{broadcastStats.totalBroadcasts}</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingEvents.length}</p>
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

          <div className="flex flex-wrap items-center gap-3">
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
              {["all", "clients", "contacts", "team", "leads"].map((filter) => (
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

        {recipients.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No recipients found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add clients, team members, or leads with email addresses to send broadcasts.
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
                          {recipient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
                        color={getTypeColor(recipient.type) as "success" | "warning" | "primary" | "light" | "info"}
                      >
                        {recipient.type.charAt(0).toUpperCase() + recipient.type.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Subject
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Recipients
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Open Rate
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Sent
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {history.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="py-3">
                      <p className="font-medium text-gray-900 dark:text-white text-theme-sm">
                        {broadcast.subject}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300">
                      {broadcast.recipientCount}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={getStatusColor(broadcast.status) as "success" | "warning" | "light"}>
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
      <Modal isOpen={isModalOpen} onClose={() => !isSending && setIsModalOpen(false)} className="max-w-3xl p-6 lg:p-8">
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
                    {template.id === "blank" && <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    {template.id === "event" && <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {template.id === "announcement" && <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                    {template.id === "newsletter" && <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                    {template.id === "reminder" && <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {template.id === "followup" && <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={async (e) => { e.preventDefault(); await handleSendBroadcast(); }} className="space-y-5 max-h-[50vh] overflow-y-auto pr-2">
            {formData.template === "event" && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Select Event</h4>
                <select
                  value={formData.selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Choose an event...</option>
                  {upcomingEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.start_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>

                {selectedEvent && (
                  <div className="mt-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                        <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{selectedEvent.title}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(selectedEvent.start_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          {selectedEvent.start_time && ` at ${selectedEvent.start_time}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedEvent.is_virtual ? "Virtual Event" : selectedEvent.venue?.name || selectedEvent.location || "Location TBA"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

              <div>
                <Label htmlFor="content">Email Content *</Label>
                <textarea
                  id="content"
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Write your email content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Available variables:</span>
                  {[
                    { var: "{{name}}", desc: "Full name" },
                    { var: "{{first_name}}", desc: "First name" },
                    { var: "{{email}}", desc: "Email address" },
                  ].map((item) => (
                    <button
                      key={item.var}
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + item.var })}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      title={item.desc}
                    >
                      <code>{item.var}</code>
                    </button>
                  ))}
                </div>
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

              {/* Attachments Section */}
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
                            <span className="block text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
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
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ← Back to templates
                </button>
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
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || uploadingFiles.length > 0 || !formData.subject || !formData.content || (formData.template === "event" && !formData.selectedEventId)}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    `Send to ${selectedCount} Recipients`
                  )}
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
