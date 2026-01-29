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
  {
    name: "Lead Qualification Pipeline",
    description: "Automatically assign, notify, and follow up when a new lead is captured.",
    trigger_type: "lead_created",
    category: "sales" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "New Lead Captured",
          message: "A new lead ({{lead_name}}) has been added from {{lead_source}}. Estimated value: {{lead_estimated_value}}.",
        },
      },
      {
        step_order: 2,
        step_type: "create_task",
        config: {
          title: "Qualify Lead: {{lead_name}}",
          description: "Review and qualify the new lead from {{lead_company}}. Check budget, timeline, and decision-making authority.",
          priority: "high",
          due_date_offset_days: 1,
        },
      },
      {
        step_order: 3,
        step_type: "send_email",
        config: {
          email_template: "custom",
          recipient_type: "specific",
          recipient_email: "{{lead_email}}",
          subject: "Thanks for your interest!",
          body: "Hi {{lead_name}}, thank you for reaching out. A member of our team will be in touch within 24 hours to discuss how we can help.",
        },
      },
    ],
  },
  {
    name: "Payment Confirmation Flow",
    description: "Send confirmation and update records when a payment is received.",
    trigger_type: "payment_received",
    category: "billing" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "Payment Received",
          message: "A payment of {{payment_amount}} has been received via {{payment_method}}.",
        },
      },
      {
        step_order: 2,
        step_type: "send_email",
        config: {
          email_template: "invoice",
          recipient_type: "entity_owner",
          subject: "Payment Confirmation",
        },
      },
      {
        step_order: 3,
        step_type: "create_task",
        config: {
          title: "Send Payment Receipt",
          description: "Generate and send official receipt for payment of {{payment_amount}}.",
          priority: "medium",
          due_date_offset_days: 1,
        },
      },
    ],
  },
  {
    name: "New Task Assignment",
    description: "Notify the assignee and create follow-up reminders when a task is created.",
    trigger_type: "task_created",
    category: "productivity" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "New Task Assigned",
          message: "You have been assigned: {{task_title}} (Priority: {{task_priority}}).",
          recipient_type: "entity_owner",
        },
      },
      {
        step_order: 2,
        step_type: "send_email",
        config: {
          email_template: "custom",
          recipient_type: "entity_owner",
          subject: "New task: {{task_title}}",
          body: "A new task has been assigned to you:\n\nTitle: {{task_title}}\nPriority: {{task_priority}}\n\nPlease review and start working on it.",
        },
      },
    ],
  },
  {
    name: "Invoice Generation Workflow",
    description: "Notify your team and email the client when a new invoice is created.",
    trigger_type: "invoice_created",
    category: "billing" as const,
    steps: [
      {
        step_order: 1,
        step_type: "send_notification",
        config: {
          title: "New Invoice Created",
          message: "Invoice {{invoice_number}} for {{invoice_amount}} has been created.",
        },
      },
      {
        step_order: 2,
        step_type: "approval",
        config: {
          instructions: "Review invoice {{invoice_number}} before sending to the client.",
        },
      },
      {
        step_order: 3,
        step_type: "send_email",
        config: {
          email_template: "invoice",
          recipient_type: "entity_owner",
          subject: "Invoice {{invoice_number}}",
        },
      },
    ],
  },
  {
    name: "Project Kickoff Automation",
    description: "Create all kickoff tasks, assign team, and notify stakeholders when a project starts.",
    trigger_type: "project_created",
    category: "onboarding" as const,
    steps: [
      {
        step_order: 1,
        step_type: "create_task",
        config: {
          title: "Define Project Scope for {{project_name}}",
          description: "Document project requirements, deliverables, and timeline.",
          priority: "urgent",
          due_date_offset_days: 2,
        },
      },
      {
        step_order: 2,
        step_type: "create_task",
        config: {
          title: "Create Project Plan",
          description: "Break down {{project_name}} into phases and milestones.",
          priority: "high",
          due_date_offset_days: 5,
        },
      },
      {
        step_order: 3,
        step_type: "create_event",
        config: {
          title: "Kickoff Meeting: {{project_name}}",
          description: "Kickoff meeting with the team and stakeholders.",
          event_type: "meeting",
          start_date_offset_days: 3,
        },
      },
      {
        step_order: 4,
        step_type: "send_email",
        config: {
          email_template: "custom",
          recipient_type: "trigger_user",
          subject: "Project {{project_name}} has been created",
          body: "Your new project {{project_name}} is set up and ready. A kickoff meeting has been scheduled and initial tasks have been created.",
        },
      },
    ],
  },
  {
    name: "Event Registration Welcome",
    description:
      "Create a contact, notify your team, and welcome new attendees when someone registers for an event.",
    trigger_type: "event_registration",
    category: "registration" as const,
    steps: [
      {
        step_order: 1,
        step_type: "create_contact",
        config: {
          first_name: "{{attendee_name}}",
          last_name: "",
          email: "{{attendee_email}}",
          phone: "{{attendee_phone}}",
          company: "{{attendee_company}}",
          job_title: "",
        },
      },
      {
        step_order: 2,
        step_type: "send_notification",
        config: {
          title: "New Event Registration",
          message:
            "{{attendee_name}} ({{attendee_email}}) has registered for {{event_title}}.",
        },
      },
      {
        step_order: 3,
        step_type: "send_email",
        config: {
          email_template: "custom",
          recipient_type: "specific",
          recipient_email: "{{attendee_email}}",
          subject: "Welcome to {{event_title}}!",
          body: "Hi {{attendee_name}},\n\nThank you for registering for {{event_title}}! We're excited to have you join us.\n\nWe'll send you more details as the event approaches.",
        },
      },
      {
        step_order: 4,
        step_type: "create_task",
        config: {
          title: "Follow up with {{attendee_name}}",
          description:
            "Send event details and preparation materials to {{attendee_email}} for {{event_title}}.",
          priority: "medium",
          due_date_offset_days: 1,
        },
      },
    ],
  },
  {
    name: "Task Completion Celebration",
    description: "Notify the team and update records when a task is marked complete.",
    trigger_type: "task_status_changed",
    category: "productivity" as const,
    steps: [
      {
        step_order: 1,
        step_type: "condition",
        config: {
          condition_field: "to_status",
          condition_operator: "equals",
          condition_value: "completed",
        },
      },
      {
        step_order: 2,
        step_type: "send_notification",
        config: {
          title: "Task Completed!",
          message: "{{entity_name}} has been marked as completed. Great work!",
          recipient_type: "trigger_user",
        },
      },
      {
        step_order: 3,
        step_type: "add_tag",
        config: {
          entity_type: "task",
          tag: "completed-automated",
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
  lead_created:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  payment_received:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  task_created:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  invoice_created:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  project_created:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  event_registration:
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
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
  sales:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  productivity:
    "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  registration:
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
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
