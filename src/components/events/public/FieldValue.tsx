import React from "react";
import type { FormField } from "@/config/eventTypeSchema";
import { Icons } from "./EventIcons";

const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface FieldValueProps {
  field: FormField;
  value: unknown;
  eventColor: string;
}

export const FieldValue: React.FC<FieldValueProps> = ({ field, value, eventColor }) => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;

  switch (field.type) {
    case "toggle":
      return (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              value ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {value ? Icons.check : Icons.x}
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case "sortable-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0"
                style={{ backgroundColor: eventColor }}
              />
              <span className="text-gray-700 dark:text-gray-300">{String(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "key-value-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="space-y-3">
          {value.map((item, index) => {
            const kvItem = item as { key?: string; value?: string };
            if (!kvItem.key && !kvItem.value) return null;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{kvItem.key}</p>
                  {kvItem.value && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{kvItem.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "person-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {value.map((person, index) => {
            const p = person as { name?: string; role?: string; company?: string; email?: string };
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {(p.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name || "Unknown"}</p>
                  {(p.role || p.company) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {[p.role, p.company].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "multiselect":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => {
            const option = field.options?.find(opt => opt.value === item);
            const label = option?.label || String(item).replace(/_/g, " ");
            return (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {label}
              </span>
            );
          })}
        </div>
      );

    case "select":
      const selectedOption = field.options?.find(opt => opt.value === value);
      const displayLabel = selectedOption?.label || String(value).replace(/_/g, " ");
      return (
        <span
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {displayLabel}
        </span>
      );

    case "datetime":
      return (
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {formatDateTime(String(value))}
        </p>
      );

    case "number":
      return (
        <p className="text-gray-700 dark:text-gray-300 text-xl font-bold">
          {String(value)}
        </p>
      );

    case "currency":
      const amount = typeof value === "number" ? value : parseFloat(String(value));
      return (
        <p className="text-gray-700 dark:text-gray-300 text-xl font-bold">
          ${amount.toLocaleString()}
        </p>
      );

    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm hover:underline break-all"
          style={{ color: eventColor }}
        >
          {String(value)}
          {Icons.arrowRight}
        </a>
      );

    case "textarea":
    case "rich-text":
      return (
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {String(value)}
        </p>
      );

    default:
      return (
        <p className="text-gray-700 dark:text-gray-300">{String(value)}</p>
      );
  }
};
