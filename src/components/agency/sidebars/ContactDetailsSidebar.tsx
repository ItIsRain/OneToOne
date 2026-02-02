"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Contact } from "../ContactsTable";

interface ContactDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

function formatContactType(type: string): string {
  return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export const ContactDetailsSidebar: React.FC<ContactDetailsSidebarProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!contact) return null;

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const location = [contact.city, contact.state, contact.country].filter(Boolean).join(", ") || "-";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(contact.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(contact)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      subtitle={contact.job_title || contact.company || ""}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={getTypeColor(contact.contact_type)}>
              {formatContactType(contact.contact_type)}
            </Badge>
            <Badge size="sm" color={getStatusColor(contact.status)}>
              {contact.status === "do_not_contact" ? "DNC" : contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
            </Badge>
            {contact.is_primary_contact && (
              <Badge size="sm" color="primary">Primary</Badge>
            )}
          </div>
          <button
            onClick={() => onEdit(contact)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Contact
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Avatar & Quick Info */}
        <div className="flex items-center gap-4">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={fullName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white">
              {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{fullName}</h3>
            {contact.job_title && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{contact.job_title}</p>
            )}
            {contact.company && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow
            label="Email"
            value={
              contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-brand-500 hover:text-brand-600">
                  {contact.email}
                </a>
              ) : null
            }
          />
          {contact.secondary_email && (
            <InfoRow
              label="Secondary Email"
              value={
                <a href={`mailto:${contact.secondary_email}`} className="text-brand-500 hover:text-brand-600">
                  {contact.secondary_email}
                </a>
              }
            />
          )}
          <InfoRow
            label="Phone"
            value={
              contact.phone ? (
                <a href={`tel:${contact.phone}`} className="text-brand-500 hover:text-brand-600">
                  {contact.phone}
                </a>
              ) : null
            }
          />
          {contact.mobile_phone && (
            <InfoRow
              label="Mobile"
              value={
                <a href={`tel:${contact.mobile_phone}`} className="text-brand-500 hover:text-brand-600">
                  {contact.mobile_phone}
                </a>
              }
            />
          )}
          <InfoRow
            label="Preferred Method"
            value={contact.preferred_contact_method ? contact.preferred_contact_method.charAt(0).toUpperCase() + contact.preferred_contact_method.slice(1) : null}
          />
        </Section>

        {/* Social Links */}
        {(contact.linkedin_url || contact.twitter_handle) && (
          <Section title="Social">
            {contact.linkedin_url && (
              <InfoRow
                label="LinkedIn"
                value={
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    View Profile
                  </a>
                }
              />
            )}
            {contact.twitter_handle && (
              <InfoRow label="Twitter" value={`@${contact.twitter_handle}`} />
            )}
          </Section>
        )}

        {/* Company Information */}
        <Section title="Organization">
          <InfoRow label="Company" value={contact.company || contact.client?.company || contact.lead?.company} />
          <InfoRow label="Department" value={contact.department} />
          <InfoRow label="Location" value={location} />
          {contact.timezone && <InfoRow label="Timezone" value={contact.timezone} />}
        </Section>

        {/* Engagement */}
        <Section title="Engagement">
          <InfoRow label="Last Contacted" value={formatDate(contact.last_contacted_at)} />
          <InfoRow label="Next Follow-up" value={formatDate(contact.next_follow_up)} />
          <InfoRow
            label="Contact Frequency"
            value={contact.contact_frequency ? contact.contact_frequency.charAt(0).toUpperCase() + contact.contact_frequency.slice(1).replace("_", " ") : null}
          />
          <InfoRow label="Email Opt-in" value={contact.email_opt_in ? "Yes" : "No"} />
        </Section>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {(contact.notes || contact.personal_notes) && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {contact.notes || contact.personal_notes}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(contact.created_at)}</p>
          <p>Updated: {formatDate(contact.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ContactDetailsSidebar;
