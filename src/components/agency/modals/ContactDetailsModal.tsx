"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Contact } from "../ContactsTable";

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
}

function getFullName(contact: Contact): string {
  return `${contact.first_name} ${contact.last_name}`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): "success" | "warning" | "error" {
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
}

function getTypeColor(type: string): "primary" | "success" | "warning" | "error" | "light" {
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
}

function formatFieldLabel(str: string | null): string {
  if (!str) return "-";
  return str
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
}) => {
  if (!contact) return null;

  const location = [contact.city, contact.state, contact.country].filter(Boolean).join(", ") || "-";
  const assignedName = contact.assigned_to_profile
    ? `${contact.assigned_to_profile.first_name} ${contact.assigned_to_profile.last_name}`
    : "-";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={getFullName(contact)}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xl font-semibold dark:bg-brand-500/20 dark:text-brand-400">
              {getInitials(contact.first_name, contact.last_name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {getFullName(contact)}
              </h3>
              {contact.is_primary_contact && (
                <span className="text-xs bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contact.job_title || "-"} {contact.department && `- ${contact.department}`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contact.company || contact.client?.name || "-"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" color={getTypeColor(contact.contact_type)}>
            {formatFieldLabel(contact.contact_type)}
          </Badge>
          <Badge size="sm" color={getStatusColor(contact.status)}>
            {contact.status === "do_not_contact" ? "DNC" : contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Primary Email</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-brand-500 hover:text-brand-600">
                    {contact.email}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            {contact.secondary_email && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Secondary Email</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  <a href={`mailto:${contact.secondary_email}`} className="text-brand-500 hover:text-brand-600">
                    {contact.secondary_email}
                  </a>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-brand-500 hover:text-brand-600">
                    {contact.phone}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            {contact.mobile_phone && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mobile Phone</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  <a href={`tel:${contact.mobile_phone}`} className="text-brand-500 hover:text-brand-600">
                    {contact.mobile_phone}
                  </a>
                </p>
              </div>
            )}
            {contact.work_phone && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Phone</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  <a href={`tel:${contact.work_phone}`} className="text-brand-500 hover:text-brand-600">
                    {contact.work_phone}
                  </a>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{location}</p>
            </div>
            {contact.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {contact.address}{contact.postal_code && `, ${contact.postal_code}`}
                </p>
              </div>
            )}
            {contact.timezone && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timezone</p>
                <p className="text-sm text-gray-800 dark:text-white/90">{contact.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(contact.linkedin_url || contact.twitter_handle) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Social Profiles
            </h4>
            <div className="flex gap-3">
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-brand-500 hover:text-brand-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {contact.twitter_handle && (
                <a
                  href={`https://twitter.com/${contact.twitter_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-brand-500 hover:text-brand-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  {contact.twitter_handle}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Communication Preferences */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Communication Preferences
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preferred Method</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatFieldLabel(contact.preferred_contact_method)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact Frequency</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatFieldLabel(contact.contact_frequency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email Opt-in</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {contact.email_opt_in ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Do Not Contact</p>
              <p className={`text-sm ${contact.do_not_contact ? "text-error-500" : "text-gray-800 dark:text-white/90"}`}>
                {contact.do_not_contact ? "Yes" : "No"}
              </p>
            </div>
            {contact.communication_notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Communication Notes</p>
                <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                  {contact.communication_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Engagement */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Engagement
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Contacted</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatDateTime(contact.last_contacted_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Follow-up</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatDateTime(contact.next_follow_up)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{assignedName}</p>
            </div>
          </div>
        </div>

        {/* Linked Records */}
        {(contact.client || contact.lead) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Linked Records
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {contact.client && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Linked Client</p>
                  <p className="text-sm text-brand-500">{contact.client.name}</p>
                </div>
              )}
              {contact.lead && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Linked Lead</p>
                  <p className="text-sm text-brand-500">{contact.lead.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Details */}
        {(contact.birthday || contact.anniversary || contact.personal_notes) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Personal Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {contact.birthday && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Birthday</p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {formatDate(contact.birthday)}
                  </p>
                </div>
              )}
              {contact.anniversary && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Anniversary</p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {formatDate(contact.anniversary)}
                  </p>
                </div>
              )}
              {contact.personal_notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Personal Notes</p>
                  <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                    {contact.personal_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source & Notes */}
        {(contact.source || contact.notes) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Source & Notes
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {contact.source && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source</p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {formatFieldLabel(contact.source)}
                  </p>
                </div>
              )}
              {contact.notes && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(contact.created_at)}</span>
            <span>Last updated: {formatDate(contact.updated_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit(contact);
          }}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Edit Contact
        </button>
      </div>
    </Modal>
  );
};
