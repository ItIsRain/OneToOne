"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "../ui/badge/Badge";
import { AddContactModal, ContactDetailsModal } from "./modals";

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  secondary_email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  work_phone: string | null;
  job_title: string | null;
  department: string | null;
  company: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  client_id: string | null;
  lead_id: string | null;
  is_primary_contact: boolean;
  reports_to: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  timezone: string | null;
  preferred_contact_method: "email" | "phone" | "whatsapp" | "linkedin" | "sms" | null;
  do_not_contact: boolean;
  email_opt_in: boolean;
  communication_notes: string | null;
  status: "active" | "inactive" | "do_not_contact";
  last_contacted_at: string | null;
  next_follow_up: string | null;
  contact_frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "as_needed" | null;
  birthday: string | null;
  anniversary: string | null;
  personal_notes: string | null;
  contact_type: "client_contact" | "lead_contact" | "vendor" | "partner" | "influencer" | "media" | "other";
  tags: string[] | null;
  source: string | null;
  notes: string | null;
  avatar_url: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string; company: string | null } | null;
  lead?: { id: string; name: string; company: string | null } | null;
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getFullName(contact: Contact): string {
  return `${contact.first_name} ${contact.last_name}`;
}

export const ContactsTable = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch contacts");
      }

      setContacts(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete contact");
      }

      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete contact");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleContactSaved = (contact: Contact) => {
    if (editingContact) {
      setContacts(contacts.map(c => c.id === contact.id ? contact : c));
    } else {
      setContacts([contact, ...contacts]);
    }
    handleModalClose();
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "do_not_contact":
        return "error";
      default:
        return "success";
    }
  };

  const getTypeColor = (type: string): "primary" | "success" | "warning" | "error" | "light" => {
    switch (type) {
      case "client_contact":
        return "primary";
      case "lead_contact":
        return "warning";
      case "vendor":
        return "success";
      case "partner":
        return "primary";
      default:
        return "light";
    }
  };

  const formatContactType = (type: string): string => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesFilter = filter === "all" || contact.contact_type === filter;
    const matchesSearch = searchQuery === "" ||
      getFullName(contact).toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchContacts}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 w-64"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Types</option>
              <option value="client_contact">Client Contacts</option>
              <option value="lead_contact">Lead Contacts</option>
              <option value="vendor">Vendors</option>
              <option value="partner">Partners</option>
              <option value="influencer">Influencers</option>
              <option value="media">Media</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={handleAddContact}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Contacts Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"}
          {filter !== "all" && ` (${formatContactType(filter)})`}
        </p>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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
              {searchQuery || filter !== "all" ? "No contacts found" : "No contacts yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Get started by adding your first contact."}
            </p>
            {!searchQuery && filter === "all" && (
              <button
                onClick={handleAddContact}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt={getFullName(contact)}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                        {getInitials(contact.first_name, contact.last_name)}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="font-semibold text-gray-800 dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                      >
                        {getFullName(contact)}
                      </button>
                      <p className="text-sm text-gray-500">{contact.job_title || "-"}</p>
                    </div>
                  </div>
                  {contact.is_primary_contact && (
                    <span className="text-xs bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    {contact.company || contact.client?.name || contact.lead?.company || "-"}
                  </p>
                  <p className="text-gray-500 truncate">{contact.email || "-"}</p>
                  <p className="text-gray-500">{contact.phone || contact.mobile_phone || "-"}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <Badge size="sm" color={getTypeColor(contact.contact_type)}>
                      {formatContactType(contact.contact_type)}
                    </Badge>
                    <Badge size="sm" color={getStatusColor(contact.status)}>
                      {contact.status === "do_not_contact" ? "DNC" : contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deletingId === contact.id}
                        className="text-error-500 hover:text-error-600 disabled:opacity-50 text-sm"
                      >
                        {deletingId === contact.id ? "..." : "Delete"}
                      </button>
                    </div>
                    <button
                      onClick={() => handleViewContact(contact)}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddContactModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleContactSaved}
        contact={editingContact}
      />

      <ContactDetailsModal
        isOpen={!!viewingContact}
        onClose={() => setViewingContact(null)}
        contact={viewingContact}
        onEdit={(contact) => {
          setViewingContact(null);
          handleEditContact(contact);
        }}
      />
    </>
  );
};
