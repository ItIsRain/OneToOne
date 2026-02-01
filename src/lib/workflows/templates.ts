/**
 * Pre-built workflow templates for common automation scenarios.
 * Users can install these with one click and customize as needed.
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "clients" | "contacts" | "events" | "tasks" | "invoices" | "projects";
  icon: string;
  popular?: boolean;
  trigger: {
    type: string;
    config?: Record<string, unknown>;
  };
  steps: {
    step_type: string;
    config: Record<string, unknown>;
  }[];
  variables: string[]; // List of variables this template uses
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ============ CLIENT TEMPLATES ============
  {
    id: "welcome-new-client",
    name: "Welcome New Client",
    description: "Send a personalized welcome email when a new client is added",
    category: "clients",
    icon: "user-plus",
    popular: true,
    trigger: { type: "client_created" },
    steps: [
      {
        step_type: "send_email",
        config: {
          recipient_type: "trigger_entity",
          subject: "Welcome to {{company}}!",
          body: `Hi {{name}},

Welcome! We're excited to have you on board.

Our team is here to help you succeed. If you have any questions, don't hesitate to reach out.

Best regards,
The Team`,
        },
      },
    ],
    variables: ["name", "email", "company"],
  },
  {
    id: "client-onboarding-tasks",
    name: "Client Onboarding Checklist",
    description: "Automatically create onboarding tasks when a new client is added",
    category: "clients",
    icon: "clipboard-list",
    popular: true,
    trigger: { type: "client_created" },
    steps: [
      {
        step_type: "create_task",
        config: {
          title: "Schedule kickoff call with {{name}}",
          description: "Reach out to {{name}} to schedule an initial kickoff meeting.",
          priority: "high",
          due_date_offset_days: 2,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Send welcome package to {{name}}",
          description: "Prepare and send the welcome package including contracts and onboarding docs.",
          priority: "medium",
          due_date_offset_days: 3,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Set up client portal access for {{name}}",
          description: "Create login credentials and configure portal access.",
          priority: "medium",
          due_date_offset_days: 1,
        },
      },
    ],
    variables: ["name", "email", "company"],
  },
  {
    id: "client-assigned-notification",
    name: "Notify on Client Assignment",
    description: "Alert team member when they're assigned to a client",
    category: "clients",
    icon: "user-check",
    trigger: { type: "client_updated" },
    steps: [
      {
        step_type: "send_email",
        config: {
          recipient_type: "entity_owner",
          subject: "You've been assigned to {{name}}",
          body: `Hello,

You have been assigned to manage the client: {{name}}.

Company: {{company}}
Email: {{email}}
Phone: {{phone}}

Please review their profile and reach out to introduce yourself.

Best regards`,
        },
      },
    ],
    variables: ["name", "email", "company", "phone", "assigned_to"],
  },

  // ============ CONTACT TEMPLATES ============
  {
    id: "welcome-new-contact",
    name: "Welcome New Contact",
    description: "Send a welcome email when a new contact is added",
    category: "contacts",
    icon: "mail",
    popular: true,
    trigger: { type: "contact_created" },
    steps: [
      {
        step_type: "send_email",
        config: {
          recipient_type: "trigger_entity",
          subject: "Nice to meet you, {{first_name}}!",
          body: `Hi {{first_name}},

Thank you for connecting with us! We're looking forward to working with you.

If there's anything you need, please don't hesitate to reach out.

Best regards`,
        },
      },
    ],
    variables: ["first_name", "last_name", "name", "email", "company"],
  },
  {
    id: "contact-follow-up-task",
    name: "Create Follow-up Task",
    description: "Automatically create a follow-up task when a new contact is added",
    category: "contacts",
    icon: "phone",
    trigger: { type: "contact_created" },
    steps: [
      {
        step_type: "create_task",
        config: {
          title: "Follow up with {{name}}",
          description: "Reach out to {{name}} at {{company}} to discuss their needs.\n\nEmail: {{email}}\nPhone: {{phone}}",
          priority: "medium",
          due_date_offset_days: 3,
        },
      },
    ],
    variables: ["name", "email", "phone", "company"],
  },

  // ============ EVENT TEMPLATES ============
  {
    id: "event-created-notification",
    name: "Event Created Notification",
    description: "Notify team when a new event is created",
    category: "events",
    icon: "calendar-plus",
    trigger: { type: "event_created" },
    steps: [
      {
        step_type: "send_notification",
        config: {
          title: "New Event: {{title}}",
          message: "A new event '{{title}}' has been created and is scheduled to start soon.",
          action_url: "/dashboard/events",
        },
      },
    ],
    variables: ["title", "name", "status", "start_date"],
  },
  {
    id: "event-preparation-tasks",
    name: "Event Preparation Checklist",
    description: "Create preparation tasks when an event is created",
    category: "events",
    icon: "clipboard-check",
    popular: true,
    trigger: { type: "event_created" },
    steps: [
      {
        step_type: "create_task",
        config: {
          title: "Prepare venue for {{title}}",
          description: "Ensure the venue is ready for the event.",
          priority: "high",
          due_date_offset_days: -1,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Send reminders for {{title}}",
          description: "Send reminder emails to all attendees.",
          priority: "high",
          due_date_offset_days: -2,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Finalize catering for {{title}}",
          description: "Confirm catering arrangements and final headcount.",
          priority: "medium",
          due_date_offset_days: -3,
        },
      },
    ],
    variables: ["title", "name", "start_date"],
  },

  // ============ TASK TEMPLATES ============
  {
    id: "task-completed-notification",
    name: "Task Completed Notification",
    description: "Notify team when a task is marked as completed",
    category: "tasks",
    icon: "check-circle",
    trigger: {
      type: "task_status_changed",
      config: { to_status: "completed" },
    },
    steps: [
      {
        step_type: "send_notification",
        config: {
          title: "Task Completed: {{title}}",
          message: "The task '{{title}}' has been marked as completed.",
          action_url: "/dashboard/tasks",
        },
      },
    ],
    variables: ["title", "name", "status", "priority"],
  },
  {
    id: "task-high-priority-alert",
    name: "High Priority Task Alert",
    description: "Send alert when a high priority task is created",
    category: "tasks",
    icon: "alert-triangle",
    trigger: { type: "task_created" },
    steps: [
      {
        step_type: "condition",
        config: {
          condition_field: "priority",
          condition_operator: "equals",
          condition_value: "high",
        },
      },
      {
        step_type: "send_notification",
        config: {
          title: "High Priority Task Created",
          message: "A new high priority task '{{title}}' requires attention.",
          action_url: "/dashboard/tasks",
        },
      },
    ],
    variables: ["title", "priority", "assigned_to"],
  },

  // ============ PROJECT TEMPLATES ============
  {
    id: "project-kickoff",
    name: "Project Kickoff Automation",
    description: "Create standard kickoff tasks when a new project starts",
    category: "projects",
    icon: "folder-plus",
    popular: true,
    trigger: { type: "project_created" },
    steps: [
      {
        step_type: "create_task",
        config: {
          title: "Schedule project kickoff meeting",
          description: "Set up the initial kickoff meeting with all stakeholders for {{name}}.",
          priority: "high",
          due_date_offset_days: 2,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Create project documentation",
          description: "Set up project folder and initial documentation for {{name}}.",
          priority: "medium",
          due_date_offset_days: 3,
        },
      },
      {
        step_type: "create_task",
        config: {
          title: "Define project milestones",
          description: "Work with team to define key milestones and deliverables.",
          priority: "medium",
          due_date_offset_days: 5,
        },
      },
      {
        step_type: "send_notification",
        config: {
          title: "New Project Started",
          message: "Project '{{name}}' has been created. Kickoff tasks have been assigned.",
          action_url: "/dashboard/projects",
        },
      },
    ],
    variables: ["name", "status", "owner_id"],
  },

  // ============ INVOICE TEMPLATES ============
  {
    id: "invoice-payment-reminder",
    name: "Payment Reminder",
    description: "Send reminder email when invoice becomes overdue",
    category: "invoices",
    icon: "alert-circle",
    popular: true,
    trigger: { type: "invoice_overdue" },
    steps: [
      {
        step_type: "send_email",
        config: {
          recipient_type: "trigger_entity",
          subject: "Payment Reminder - Invoice #{{invoice_number}}",
          body: `Dear {{name}},

This is a friendly reminder that invoice #{{invoice_number}} for {{amount}} is now overdue.

Please arrange payment at your earliest convenience. If you've already sent payment, please disregard this message.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your prompt attention to this matter.

Best regards`,
        },
      },
    ],
    variables: ["name", "email", "invoice_number", "amount"],
  },
  {
    id: "invoice-paid-thank-you",
    name: "Payment Received Thank You",
    description: "Send thank you email when invoice is paid",
    category: "invoices",
    icon: "check-square",
    trigger: { type: "invoice_paid" },
    steps: [
      {
        step_type: "send_email",
        config: {
          recipient_type: "trigger_entity",
          subject: "Thank You - Payment Received",
          body: `Dear {{name}},

Thank you for your payment! We've received your payment for invoice #{{invoice_number}}.

We appreciate your business and look forward to continuing to work with you.

Best regards`,
        },
      },
      {
        step_type: "send_notification",
        config: {
          title: "Payment Received",
          message: "Invoice #{{invoice_number}} has been paid by {{name}}.",
          action_url: "/dashboard/invoices",
        },
      },
    ],
    variables: ["name", "email", "invoice_number", "amount"],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: WorkflowTemplate["category"]): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get popular templates
 */
export function getPopularTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.popular);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

/**
 * Template categories with metadata
 */
export const TEMPLATE_CATEGORIES = [
  { id: "clients", label: "Clients", icon: "users", color: "bg-blue-500" },
  { id: "contacts", label: "Contacts", icon: "user", color: "bg-green-500" },
  { id: "events", label: "Events", icon: "calendar", color: "bg-purple-500" },
  { id: "tasks", label: "Tasks", icon: "check-square", color: "bg-orange-500" },
  { id: "projects", label: "Projects", icon: "folder", color: "bg-cyan-500" },
  { id: "invoices", label: "Invoices", icon: "file-text", color: "bg-pink-500" },
] as const;
