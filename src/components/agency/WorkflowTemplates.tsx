"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEMPLATES = [
  {
    name: "Client Onboarding Pipeline",
    description:
      "Automatically create tasks and notify your team when a new client is added.",
    trigger_type: "client_created",
    category: "onboarding" as const,
    steps: [
      {
        step_order: 1,
        step_type: "create_task",
        config: {
          title: "Welcome Call",
          description: "Schedule and conduct welcome call with new client",
          priority: "high",
        },
      },
      {
        step_order: 2,
        step_type: "send_notification",
        config: {
          title: "New Client Added",
          message:
            "A new client has been onboarded. Please review their details.",
        },
      },
      {
        step_order: 3,
        step_type: "create_task",
        config: {
          title: "Setup Project",
          description: "Create initial project setup for the new client",
          priority: "medium",
        },
      },
      {
        step_order: 4,
        step_type: "create_task",
        config: {
          title: "Send Welcome Email",
          description: "Send welcome email with onboarding materials",
          priority: "medium",
        },
      },
    ],
  },
  {
    name: "Content Review & Approval",
    description:
      "Route content through review and approval before marking as complete.",
    trigger_type: "task_status_changed",
    category: "review" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "Content Ready for Review",
          message: "A task is ready for your review.",
        },
      },
      {
        step_order: 2,
        step_type: "approval",
        config: {
          instructions: "Review the content and approve or reject.",
        },
      },
      {
        step_order: 3,
        step_type: "update_status",
        config: { entity_type: "task", new_status: "completed" },
      },
      {
        step_order: 4,
        step_type: "send_notification",
        config: {
          title: "Content Approved",
          message:
            "Your content has been approved and marked as complete.",
        },
      },
    ],
  },
  {
    name: "Event Planning Checklist",
    description:
      "Auto-generate planning tasks when a new event is created.",
    trigger_type: "event_created",
    category: "event" as const,
    steps: [
      {
        step_order: 1,
        step_type: "create_task",
        config: {
          title: "Book Venue",
          description: "Research and book venue for the event",
          priority: "high",
        },
      },
      {
        step_order: 2,
        step_type: "create_task",
        config: {
          title: "Send Invitations",
          description: "Design and send event invitations",
          priority: "medium",
        },
      },
      {
        step_order: 3,
        step_type: "create_task",
        config: {
          title: "Setup Registration",
          description: "Configure registration page and payment",
          priority: "medium",
        },
      },
      {
        step_order: 4,
        step_type: "create_task",
        config: {
          title: "Pre-event Checklist",
          description: "Complete final checks before the event",
          priority: "low",
        },
      },
    ],
  },
  {
    name: "Invoice Follow-up",
    description:
      "Automated reminders and escalation for overdue invoices.",
    trigger_type: "invoice_overdue",
    category: "billing" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "Invoice Overdue",
          message: "An invoice is past due. Sending reminder.",
        },
      },
      {
        step_order: 2,
        step_type: "wait_delay",
        config: { duration: 3, unit: "days" },
      },
      {
        step_order: 3,
        step_type: "send_email",
        config: {
          subject: "Payment Reminder",
          body: "This is a friendly reminder that your invoice is overdue.",
        },
      },
      {
        step_order: 4,
        step_type: "approval",
        config: {
          instructions:
            "Approve escalation to collections follow-up call.",
        },
      },
      {
        step_order: 5,
        step_type: "create_task",
        config: {
          title: "Follow Up Call",
          description: "Call client about overdue invoice",
          priority: "urgent",
        },
      },
    ],
  },
];

const TRIGGER_BADGE_COLORS: Record<string, string> = {
  client_created:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  task_status_changed:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  event_created:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  invoice_overdue:
    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  onboarding:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  review:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  event:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  billing:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

function formatTriggerType(trigger: string): string {
  return trigger
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const WorkflowTemplates = () => {
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleUseTemplate = async (
    template: (typeof TEMPLATES)[number],
    index: number,
  ) => {
    if (loadingIndex !== null) return;
    setLoadingIndex(index);

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_config: {},
          steps: template.steps,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const data = await response.json();
      const wf = data.workflow ?? data;
      router.push(`/dashboard/automation/workflows/${wf.id}`);
    } catch (error) {
      console.error("Error creating workflow from template:", error);
      setLoadingIndex(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {TEMPLATES.map((template, index) => (
        <div
          key={template.name}
          className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 hover:shadow-md transition-shadow"
        >
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TRIGGER_BADGE_COLORS[template.trigger_type] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              {formatTriggerType(template.trigger_type)}
            </span>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE_COLORS[template.category] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
            >
              {template.category.charAt(0).toUpperCase() +
                template.category.slice(1)}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {template.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {template.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {template.steps.length} steps
            </span>

            <button
              type="button"
              onClick={() => handleUseTemplate(template, index)}
              disabled={loadingIndex !== null}
              className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingIndex === index ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Use Template"
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
