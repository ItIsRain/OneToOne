"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Client } from "../ClientsTable";

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
}

function capitalizeName(str: string | null): string {
  if (!str) return "-";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string): "success" | "warning" | "error" | "primary" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "error";
    case "archived":
      return "warning";
    default:
      return "primary";
  }
}

function formatIndustry(industry: string | null): string {
  if (!industry) return "-";
  return industry
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSource(source: string | null): string {
  if (!source) return "-";
  return source
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
}) => {
  if (!client) return null;

  const location = [client.city, client.country].filter(Boolean).join(", ") || "-";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {capitalizeName(client.name)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {client.company || "No company"}
          </p>
        </div>
        <Badge
          size="sm"
          color={getStatusColor(client.status)}
        >
          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="text-brand-500 hover:text-brand-600">
                    {client.email}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {client.phone ? (
                  <a href={`tel:${client.phone}`} className="text-brand-500 hover:text-brand-600">
                    {client.phone}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Website</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {client.website ? (
                  <a
                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    {client.website}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{location}</p>
            </div>
            {client.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="text-sm text-gray-800 dark:text-white/90">{client.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Business Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Industry</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatIndustry(client.industry)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lead Source</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatSource(client.source)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Events</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{client.events_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formatRevenue(client.total_revenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Notes
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(client.created_at)}</span>
            <span>Last updated: {formatDate(client.updated_at)}</span>
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
            onEdit(client);
          }}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Edit Client
        </button>
      </div>
    </Modal>
  );
};
