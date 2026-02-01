"use client";

import React, { useState, useRef, useEffect } from "react";

interface Variable {
  name: string;
  label: string;
  description: string;
  example: string;
}

interface VariableCategory {
  name: string;
  variables: Variable[];
}

// Variable definitions for each trigger type
const TRIGGER_VARIABLES: Record<string, VariableCategory[]> = {
  client_created: [
    {
      name: "Client Info",
      variables: [
        { name: "name", label: "Client Name", description: "Full name of the client", example: "John Smith" },
        { name: "email", label: "Email", description: "Client email address", example: "john@example.com" },
        { name: "phone", label: "Phone", description: "Client phone number", example: "+1 555-0123" },
        { name: "company", label: "Company", description: "Client company name", example: "Acme Inc." },
        { name: "status", label: "Status", description: "Client status", example: "active" },
      ],
    },
    {
      name: "System",
      variables: [
        { name: "entity_id", label: "Client ID", description: "Unique client identifier", example: "uuid-123" },
        { name: "entity_type", label: "Entity Type", description: "Type of entity", example: "client" },
        { name: "created_by", label: "Created By", description: "User who created the client", example: "uuid-456" },
      ],
    },
  ],
  client_updated: [
    {
      name: "Client Info",
      variables: [
        { name: "name", label: "Client Name", description: "Full name of the client", example: "John Smith" },
        { name: "email", label: "Email", description: "Client email address", example: "john@example.com" },
        { name: "phone", label: "Phone", description: "Client phone number", example: "+1 555-0123" },
        { name: "company", label: "Company", description: "Client company name", example: "Acme Inc." },
        { name: "status", label: "Status", description: "Client status", example: "active" },
        { name: "assigned_to", label: "Assigned To", description: "User assigned to client", example: "uuid-789" },
      ],
    },
  ],
  contact_created: [
    {
      name: "Contact Info",
      variables: [
        { name: "name", label: "Full Name", description: "Contact full name", example: "Jane Doe" },
        { name: "first_name", label: "First Name", description: "Contact first name", example: "Jane" },
        { name: "last_name", label: "Last Name", description: "Contact last name", example: "Doe" },
        { name: "email", label: "Email", description: "Contact email", example: "jane@example.com" },
        { name: "phone", label: "Phone", description: "Contact phone", example: "+1 555-0456" },
        { name: "company", label: "Company", description: "Company name", example: "Tech Corp" },
        { name: "job_title", label: "Job Title", description: "Contact job title", example: "Marketing Manager" },
      ],
    },
  ],
  contact_updated: [
    {
      name: "Contact Info",
      variables: [
        { name: "name", label: "Full Name", description: "Contact full name", example: "Jane Doe" },
        { name: "first_name", label: "First Name", description: "Contact first name", example: "Jane" },
        { name: "last_name", label: "Last Name", description: "Contact last name", example: "Doe" },
        { name: "email", label: "Email", description: "Contact email", example: "jane@example.com" },
        { name: "phone", label: "Phone", description: "Contact phone", example: "+1 555-0456" },
        { name: "company", label: "Company", description: "Company name", example: "Tech Corp" },
        { name: "assigned_to", label: "Assigned To", description: "User assigned to contact", example: "uuid-789" },
      ],
    },
  ],
  event_created: [
    {
      name: "Event Info",
      variables: [
        { name: "title", label: "Event Title", description: "Name of the event", example: "Annual Conference" },
        { name: "name", label: "Event Name", description: "Same as title", example: "Annual Conference" },
        { name: "status", label: "Status", description: "Event status", example: "upcoming" },
        { name: "start_date", label: "Start Date", description: "Event start date", example: "2024-03-15" },
        { name: "end_date", label: "End Date", description: "Event end date", example: "2024-03-17" },
      ],
    },
  ],
  task_created: [
    {
      name: "Task Info",
      variables: [
        { name: "title", label: "Task Title", description: "Task title", example: "Review proposal" },
        { name: "name", label: "Task Name", description: "Same as title", example: "Review proposal" },
        { name: "status", label: "Status", description: "Task status", example: "todo" },
        { name: "priority", label: "Priority", description: "Task priority", example: "high" },
        { name: "assigned_to", label: "Assigned To", description: "User assigned to task", example: "uuid-789" },
        { name: "due_date", label: "Due Date", description: "Task due date", example: "2024-03-20" },
      ],
    },
  ],
  task_status_changed: [
    {
      name: "Task Info",
      variables: [
        { name: "title", label: "Task Title", description: "Task title", example: "Review proposal" },
        { name: "status", label: "New Status", description: "New task status", example: "completed" },
        { name: "from_status", label: "Previous Status", description: "Previous status", example: "in_progress" },
        { name: "to_status", label: "New Status", description: "New status", example: "completed" },
        { name: "priority", label: "Priority", description: "Task priority", example: "high" },
      ],
    },
  ],
  task_completed: [
    {
      name: "Task Info",
      variables: [
        { name: "title", label: "Task Title", description: "Task title", example: "Review proposal" },
        { name: "name", label: "Task Name", description: "Same as title", example: "Review proposal" },
        { name: "priority", label: "Priority", description: "Task priority", example: "high" },
        { name: "assigned_to", label: "Completed By", description: "User who completed", example: "uuid-789" },
      ],
    },
  ],
  project_created: [
    {
      name: "Project Info",
      variables: [
        { name: "name", label: "Project Name", description: "Name of the project", example: "Website Redesign" },
        { name: "status", label: "Status", description: "Project status", example: "planning" },
        { name: "owner_id", label: "Project Manager", description: "Project manager ID", example: "uuid-789" },
      ],
    },
  ],
  invoice_created: [
    {
      name: "Invoice Info",
      variables: [
        { name: "invoice_number", label: "Invoice Number", description: "Invoice number", example: "INV-001" },
        { name: "amount", label: "Amount", description: "Invoice amount", example: "$1,500.00" },
        { name: "name", label: "Client Name", description: "Client name", example: "John Smith" },
        { name: "email", label: "Client Email", description: "Client email", example: "john@example.com" },
        { name: "due_date", label: "Due Date", description: "Payment due date", example: "2024-03-30" },
      ],
    },
  ],
  invoice_overdue: [
    {
      name: "Invoice Info",
      variables: [
        { name: "invoice_number", label: "Invoice Number", description: "Invoice number", example: "INV-001" },
        { name: "amount", label: "Amount", description: "Invoice amount", example: "$1,500.00" },
        { name: "name", label: "Client Name", description: "Client name", example: "John Smith" },
        { name: "email", label: "Client Email", description: "Client email", example: "john@example.com" },
        { name: "days_overdue", label: "Days Overdue", description: "Number of days overdue", example: "5" },
      ],
    },
  ],
  invoice_paid: [
    {
      name: "Invoice Info",
      variables: [
        { name: "invoice_number", label: "Invoice Number", description: "Invoice number", example: "INV-001" },
        { name: "amount", label: "Amount", description: "Amount paid", example: "$1,500.00" },
        { name: "name", label: "Client Name", description: "Client name", example: "John Smith" },
        { name: "email", label: "Client Email", description: "Client email", example: "john@example.com" },
        { name: "paid_date", label: "Payment Date", description: "Date payment received", example: "2024-03-25" },
      ],
    },
  ],
  manual: [
    {
      name: "Manual Trigger",
      variables: [
        { name: "triggered_by", label: "Triggered By", description: "User who triggered", example: "uuid-123" },
      ],
    },
  ],
};

// Default variables available in all triggers
const DEFAULT_VARIABLES: VariableCategory = {
  name: "Common",
  variables: [
    { name: "entity_id", label: "Entity ID", description: "ID of the triggering entity", example: "uuid-123" },
    { name: "entity_type", label: "Entity Type", description: "Type of entity", example: "client" },
  ],
};

interface VariablePickerProps {
  triggerType: string;
  onInsert: (variable: string) => void;
  className?: string;
}

export function VariablePicker({ triggerType, onInsert, className = "" }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = TRIGGER_VARIABLES[triggerType] || [DEFAULT_VARIABLES];

  // Filter variables by search
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      variables: cat.variables.filter(
        (v) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.label.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.variables.length > 0);

  const handleInsert = (variable: string) => {
    onInsert(`{{${variable}}}`);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Insert Variable
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Search */}
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          {/* Variables list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredCategories.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-gray-400">No variables found</p>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.name} className="mb-2">
                  <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {category.name}
                  </p>
                  <div className="space-y-0.5">
                    {category.variables.map((variable) => (
                      <button
                        key={variable.name}
                        type="button"
                        onClick={() => handleInsert(variable.name)}
                        className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <code className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-brand-600 group-hover:bg-brand-100 dark:bg-gray-700 dark:text-brand-400 dark:group-hover:bg-brand-900/30">
                          {`{{${variable.name}}}`}
                        </code>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                            {variable.label}
                          </p>
                          <p className="truncate text-[10px] text-gray-400">
                            e.g. {variable.example}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer tip */}
          <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700">
            <p className="text-[10px] text-gray-400">
              Click a variable to insert it into your text
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline variable picker button that appears inside input fields
 */
interface InlineVariablePickerProps {
  triggerType: string;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInsert?: () => void;
}

export function InlineVariablePicker({ triggerType, inputRef, onInsert }: InlineVariablePickerProps) {
  const handleInsert = (variable: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;
    const newValue = value.substring(0, start) + variable + value.substring(end);

    // Update value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeInputValueSetter?.call(input, newValue);

    // Trigger change event
    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);

    // Set cursor position after inserted variable
    setTimeout(() => {
      input.focus();
      const newPos = start + variable.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);

    onInsert?.();
  };

  return <VariablePicker triggerType={triggerType} onInsert={handleInsert} />;
}

export { TRIGGER_VARIABLES };
