"use client";

import React, { useState, useEffect } from "react";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface ApiEndpoint {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
  requestBody?: Record<string, any>;
  responseExample?: Record<string, any>;
  queryParams?: { name: string; type: string; description: string; required?: boolean }[];
}

interface ApiCategory {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}

const apiCategories: ApiCategory[] = [
  {
    name: "Events",
    description: "Manage events, attendees, and registrations",
    endpoints: [
      {
        method: "GET",
        path: "/api/events",
        description: "List all events for your organization",
        auth: true,
        queryParams: [
          { name: "status", type: "string", description: "Filter by status (upcoming, ongoing, completed, cancelled)", required: false },
          { name: "category", type: "string", description: "Filter by category", required: false },
          { name: "event_type", type: "string", description: "Filter by event type", required: false },
          { name: "start_date", type: "string", description: "Filter events starting after this date", required: false },
          { name: "end_date", type: "string", description: "Filter events starting before this date", required: false },
          { name: "client_id", type: "string", description: "Filter by client", required: false },
          { name: "is_virtual", type: "boolean", description: "Filter virtual events", required: false },
        ],
        responseExample: [
          {
            id: "uuid",
            title: "Tech Conference 2026",
            slug: "tech-conference-2026",
            description: "Annual tech conference",
            start_date: "2026-03-15T09:00:00Z",
            end_date: "2026-03-16T18:00:00Z",
            status: "upcoming",
            location: "Dubai, UAE",
            is_virtual: false,
            max_attendees: 500,
            client: { id: "uuid", name: "Acme Corp" },
          },
        ],
      },
      {
        method: "POST",
        path: "/api/events",
        description: "Create a new event",
        auth: true,
        requestBody: {
          title: "Tech Conference 2026",
          description: "Annual tech conference",
          start_date: "2026-03-15T09:00:00Z",
          end_date: "2026-03-16T18:00:00Z",
          location: "Dubai, UAE",
          status: "upcoming",
          event_type: "conference",
          category: "Technology",
          is_virtual: false,
          max_attendees: 500,
          is_public: true,
          registration_required: true,
          client_id: "uuid (optional)",
          venue_id: "uuid (optional)",
        },
        responseExample: {
          id: "uuid",
          title: "Tech Conference 2026",
          slug: "tech-conference-2026",
          status: "upcoming",
        },
      },
      {
        method: "GET",
        path: "/api/events/{id}",
        description: "Get event details by ID",
        auth: true,
        responseExample: {
          id: "uuid",
          title: "Tech Conference 2026",
          description: "Annual tech conference",
          start_date: "2026-03-15T09:00:00Z",
          end_date: "2026-03-16T18:00:00Z",
          status: "upcoming",
          client: { id: "uuid", name: "Acme Corp" },
          venue: { id: "uuid", name: "Dubai Convention Center" },
        },
      },
      {
        method: "PATCH",
        path: "/api/events/{id}",
        description: "Update an event",
        auth: true,
        requestBody: {
          title: "Updated Event Title",
          status: "ongoing",
          description: "Updated description",
        },
      },
      {
        method: "DELETE",
        path: "/api/events/{id}",
        description: "Delete an event",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/events/{id}/attendees",
        description: "List all attendees for an event",
        auth: true,
        responseExample: {
          attendees: [
            {
              id: "uuid",
              name: "John Doe",
              email: "john@example.com",
              phone: "+1234567890",
              status: "registered",
              created_at: "2026-01-15T10:00:00Z",
            },
          ],
        },
      },
      {
        method: "POST",
        path: "/api/events/{id}/attendees",
        description: "Add an attendee to an event",
        auth: true,
        requestBody: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890",
          status: "registered",
        },
      },
    ],
  },
  {
    name: "Public Events",
    description: "Public endpoints for event registration (no auth required)",
    endpoints: [
      {
        method: "GET",
        path: "/api/events/public/{slug}",
        description: "Get public event details by slug",
        auth: false,
        responseExample: {
          id: "uuid",
          title: "Tech Conference 2026",
          slug: "tech-conference-2026",
          description: "Annual tech conference",
          start_date: "2026-03-15T09:00:00Z",
          end_date: "2026-03-16T18:00:00Z",
          location: "Dubai, UAE",
          is_public: true,
          is_published: true,
          registration_required: true,
          max_attendees: 500,
          attendees_count: 150,
        },
      },
      {
        method: "POST",
        path: "/api/events/public/{slug}/register",
        description: "Register for a public event",
        auth: false,
        requestBody: {
          name: "John Doe (required)",
          email: "john@example.com (required)",
          phone: "+1234567890",
          company: "Acme Corp",
          notes: "Dietary requirements: vegetarian",
        },
        responseExample: {
          success: true,
          attendee: {
            id: "uuid",
            name: "John Doe",
            email: "john@example.com",
            status: "registered",
          },
          message: "Successfully registered for the event",
        },
      },
      {
        method: "GET",
        path: "/api/events/public/{slug}/attendees",
        description: "Get attendee list for public event (if enabled)",
        auth: false,
      },
      {
        method: "GET",
        path: "/api/events/public/{slug}/teams",
        description: "List teams for hackathon events",
        auth: false,
      },
      {
        method: "POST",
        path: "/api/events/public/{slug}/teams",
        description: "Create a team for hackathon events",
        auth: false,
        requestBody: {
          name: "Team Alpha",
          description: "Our team description",
        },
      },
    ],
  },
  {
    name: "Clients",
    description: "Manage client records (requires Starter plan or higher)",
    endpoints: [
      {
        method: "GET",
        path: "/api/clients",
        description: "List all clients",
        auth: true,
        responseExample: {
          clients: [
            {
              id: "uuid",
              name: "Acme Corp",
              email: "contact@acme.com",
              phone: "+1234567890",
              company: "Acme Corporation",
              status: "active",
              website: "https://acme.com",
              address: "123 Business St",
              city: "Dubai",
              country: "UAE",
              industry: "Technology",
              source: "referral",
              created_at: "2026-01-15T10:00:00Z",
            },
          ],
        },
      },
      {
        method: "POST",
        path: "/api/clients",
        description: "Create a new client",
        auth: true,
        requestBody: {
          name: "Acme Corp (required)",
          email: "contact@acme.com",
          phone: "+1234567890",
          company: "Acme Corporation",
          website: "https://acme.com",
          address: "123 Business St",
          city: "Dubai",
          country: "UAE",
          industry: "Technology",
          source: "website",
          status: "active",
          notes: "Important client",
          tags: ["enterprise", "tech"],
        },
        responseExample: {
          client: {
            id: "uuid",
            name: "Acme Corp",
            email: "contact@acme.com",
            status: "active",
          },
        },
      },
      {
        method: "GET",
        path: "/api/clients/{id}",
        description: "Get client details",
        auth: true,
      },
      {
        method: "PATCH",
        path: "/api/clients/{id}",
        description: "Update a client",
        auth: true,
        requestBody: {
          name: "Updated Name",
          status: "inactive",
          notes: "Updated notes",
        },
      },
      {
        method: "DELETE",
        path: "/api/clients/{id}",
        description: "Delete a client",
        auth: true,
      },
    ],
  },
  {
    name: "Leads",
    description: "Manage sales leads (requires Starter plan or higher)",
    endpoints: [
      {
        method: "GET",
        path: "/api/leads",
        description: "List all leads",
        auth: true,
        responseExample: {
          leads: [
            {
              id: "uuid",
              name: "Jane Smith",
              email: "jane@company.com",
              phone: "+1234567890",
              company: "Acme Corp",
              job_title: "CTO",
              status: "new",
              source: "website",
              estimated_value: 50000,
              priority: "high",
              assigned_to_profile: { id: "uuid", first_name: "John", last_name: "Doe" },
              created_at: "2026-01-15T10:00:00Z",
            },
          ],
        },
      },
      {
        method: "POST",
        path: "/api/leads",
        description: "Create a new lead",
        auth: true,
        requestBody: {
          name: "Jane Smith (required)",
          email: "jane@company.com",
          phone: "+1234567890",
          company: "Acme Corp",
          job_title: "CTO",
          status: "new",
          source: "website",
          estimated_value: 50000,
          priority: "high",
          assigned_to: "user-uuid",
          notes: "Interested in enterprise plan",
        },
        responseExample: {
          lead: {
            id: "uuid",
            name: "Jane Smith",
            email: "jane@company.com",
            status: "new",
          },
        },
      },
      {
        method: "GET",
        path: "/api/leads/{id}",
        description: "Get lead details",
        auth: true,
        responseExample: {
          lead: {
            id: "uuid",
            name: "Jane Smith",
            email: "jane@company.com",
            status: "new",
          },
        },
      },
      {
        method: "PATCH",
        path: "/api/leads/{id}",
        description: "Update a lead",
        auth: true,
        requestBody: {
          status: "qualified",
          assigned_to: "user-uuid",
          estimated_value: 75000,
        },
        responseExample: {
          lead: {
            id: "uuid",
            name: "Jane Smith",
            status: "qualified",
          },
        },
      },
      {
        method: "DELETE",
        path: "/api/leads/{id}",
        description: "Delete a lead",
        auth: true,
        responseExample: {
          success: true,
        },
      },
    ],
  },
  {
    name: "Invoices",
    description: "Manage invoices and billing (requires Professional plan or higher)",
    endpoints: [
      {
        method: "GET",
        path: "/api/invoices",
        description: "List all invoices",
        auth: true,
        responseExample: {
          invoices: [
            {
              id: "uuid",
              invoice_number: "INV-26-0001",
              client_id: "uuid",
              subtotal: 1500.00,
              tax_rate: 5,
              tax_amount: 75.00,
              total: 1575.00,
              currency: "USD",
              status: "sent",
              issue_date: "2026-01-15",
              due_date: "2026-02-15",
              client: { id: "uuid", name: "Acme Corp", email: "billing@acme.com" },
              project: { id: "uuid", name: "Website Redesign" },
            },
          ],
        },
      },
      {
        method: "POST",
        path: "/api/invoices",
        description: "Create a new invoice",
        auth: true,
        requestBody: {
          client_id: "uuid",
          project_id: "uuid (optional)",
          title: "Website Development Services",
          subtotal: 1500.00,
          tax_rate: 5,
          discount_type: "fixed",
          discount_value: 100,
          currency: "USD",
          due_date: "2026-02-15",
          payment_terms: "net_30",
          notes: "Thank you for your business",
          items: [
            { description: "Consulting Services", quantity: 10, unit_price: 150 },
          ],
        },
        responseExample: {
          invoice: {
            id: "uuid",
            invoice_number: "INV-26-0001",
            total: 1475.00,
            status: "draft",
          },
        },
      },
      {
        method: "GET",
        path: "/api/invoices/{id}",
        description: "Get invoice details with items and payments",
        auth: true,
        responseExample: {
          invoice: {
            id: "uuid",
            invoice_number: "INV-26-0001",
            total: 1575.00,
            status: "sent",
            items: [
              { description: "Consulting", quantity: 10, unit_price: 150, amount: 1500 },
            ],
            payments: [],
          },
        },
      },
      {
        method: "PATCH",
        path: "/api/invoices/{id}",
        description: "Update invoice",
        auth: true,
        requestBody: {
          status: "paid",
          notes: "Updated notes",
        },
        responseExample: {
          invoice: {
            id: "uuid",
            invoice_number: "INV-26-0001",
            status: "paid",
          },
        },
      },
      {
        method: "DELETE",
        path: "/api/invoices/{id}",
        description: "Delete an invoice",
        auth: true,
        responseExample: {
          success: true,
        },
      },
    ],
  },
  {
    name: "Projects",
    description: "Manage projects",
    endpoints: [
      {
        method: "GET",
        path: "/api/projects",
        description: "List all projects",
        auth: true,
        responseExample: [
          {
            id: "uuid",
            name: "Website Redesign",
            project_code: "WEB-001",
            description: "Complete website overhaul",
            status: "in_progress",
            start_date: "2026-01-15",
            end_date: "2026-04-01",
            budget: 25000,
            client: { id: "uuid", name: "Acme Corp", company: "Acme Corporation" },
            project_manager: { id: "uuid", first_name: "John", last_name: "Doe" },
          },
        ],
      },
      {
        method: "POST",
        path: "/api/projects",
        description: "Create a new project",
        auth: true,
        requestBody: {
          name: "Website Redesign",
          project_code: "WEB-001",
          client_id: "uuid",
          description: "Complete website overhaul",
          status: "planning",
          start_date: "2026-01-15",
          end_date: "2026-04-01",
          budget: 25000,
          project_manager_id: "user-uuid",
        },
        responseExample: {
          id: "uuid",
          name: "Website Redesign",
          project_code: "WEB-001",
          status: "planning",
        },
      },
      {
        method: "GET",
        path: "/api/projects/{id}",
        description: "Get project details",
        auth: true,
        responseExample: {
          id: "uuid",
          name: "Website Redesign",
          description: "Complete website overhaul",
          status: "in_progress",
          client: { id: "uuid", name: "Acme Corp" },
          project_manager: { id: "uuid", first_name: "John", last_name: "Doe" },
        },
      },
      {
        method: "PATCH",
        path: "/api/projects/{id}",
        description: "Update a project",
        auth: true,
        requestBody: {
          status: "completed",
          end_date: "2026-03-28",
        },
        responseExample: {
          id: "uuid",
          name: "Website Redesign",
          status: "completed",
        },
      },
      {
        method: "DELETE",
        path: "/api/projects/{id}",
        description: "Delete a project",
        auth: true,
        responseExample: {
          success: true,
        },
      },
    ],
  },
  {
    name: "Tasks",
    description: "Manage tasks",
    endpoints: [
      {
        method: "GET",
        path: "/api/tasks",
        description: "List all tasks",
        auth: true,
        queryParams: [
          { name: "project_id", type: "string", description: "Filter by project", required: false },
          { name: "status", type: "string", description: "Filter by status (todo, in_progress, review, done)", required: false },
          { name: "assigned_to", type: "string", description: "Filter by assigned user", required: false },
        ],
        responseExample: [
          {
            id: "uuid",
            title: "Design homepage mockup",
            description: "Create initial design mockups",
            status: "in_progress",
            priority: "high",
            due_date: "2026-02-01",
            project: { id: "uuid", name: "Website Redesign", project_code: "WEB-001" },
            assignee: { id: "uuid", first_name: "Jane", last_name: "Smith" },
          },
        ],
      },
      {
        method: "POST",
        path: "/api/tasks",
        description: "Create a new task",
        auth: true,
        requestBody: {
          title: "Design homepage mockup",
          description: "Create initial design mockups",
          project_id: "uuid",
          assigned_to: "user-uuid",
          due_date: "2026-02-01",
          priority: "high",
          status: "todo",
        },
        responseExample: {
          id: "uuid",
          title: "Design homepage mockup",
          status: "todo",
          assignee: { id: "uuid", first_name: "Jane", last_name: "Smith" },
        },
      },
    ],
  },
  {
    name: "Team",
    description: "Manage team members and time tracking",
    endpoints: [
      {
        method: "GET",
        path: "/api/team/members",
        description: "List all team members and pending invites",
        auth: true,
        responseExample: {
          members: [
            {
              id: "uuid",
              first_name: "John",
              last_name: "Doe",
              email: "john@company.com",
              phone: "+1234567890",
              job_title: "Software Engineer",
              department: "Engineering",
              role: "admin",
              status: "active",
              custom_role: { id: "uuid", name: "Developer", color: "#3B82F6" },
              manager: { id: "uuid", first_name: "Jane", last_name: "Smith" },
              is_invite: false,
            },
          ],
        },
      },
      {
        method: "POST",
        path: "/api/team/members",
        description: "Invite a new team member (owner/admin only)",
        auth: true,
        requestBody: {
          first_name: "New (required)",
          last_name: "Member",
          email: "newmember@company.com (required)",
          phone: "+1234567890",
          job_title: "Software Engineer",
          department: "Engineering",
          role: "member",
          custom_role_id: "uuid (optional)",
          manager_id: "uuid (optional)",
          hourly_rate: 75,
        },
        responseExample: {
          member: {
            id: "uuid",
            first_name: "New",
            last_name: "Member",
            email: "newmember@company.com",
            status: "pending_invite",
            is_invite: true,
          },
          inviteToken: "uuid-token",
          emailSent: true,
        },
      },
      {
        method: "GET",
        path: "/api/team/time-entries",
        description: "List time entries (requires Professional plan or higher)",
        auth: true,
        queryParams: [
          { name: "user_id", type: "string", description: "Filter by user", required: false },
          { name: "project_id", type: "string", description: "Filter by project", required: false },
          { name: "status", type: "string", description: "Filter by status (draft, submitted, approved, rejected)", required: false },
          { name: "start_date", type: "string", description: "Start date filter (YYYY-MM-DD)", required: false },
          { name: "end_date", type: "string", description: "End date filter (YYYY-MM-DD)", required: false },
        ],
        responseExample: {
          timeEntries: [
            {
              id: "uuid",
              date: "2026-01-27",
              start_time: "09:00",
              end_time: "12:00",
              duration_minutes: 180,
              description: "Working on homepage design",
              is_billable: true,
              status: "approved",
              project: { id: "uuid", name: "Website Redesign" },
              user: { id: "uuid", first_name: "John", last_name: "Doe" },
            },
          ],
          stats: {
            today: 180,
            thisWeek: 2400,
            thisMonth: 9600,
            billable: 8000,
            pending: 5,
          },
        },
      },
      {
        method: "POST",
        path: "/api/team/time-entries",
        description: "Log a time entry",
        auth: true,
        requestBody: {
          project_id: "uuid",
          task_id: "uuid (optional)",
          date: "2026-01-27 (required)",
          start_time: "09:00",
          end_time: "12:00",
          duration_minutes: 180,
          description: "Working on homepage design",
          is_billable: true,
          status: "draft",
        },
        responseExample: {
          timeEntry: {
            id: "uuid",
            date: "2026-01-27",
            duration_minutes: 180,
            description: "Working on homepage design",
            status: "draft",
          },
        },
      },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  PUT: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = "json" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

const EndpointCard: React.FC<{ endpoint: ApiEndpoint; baseUrl: string }> = ({ endpoint, baseUrl }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const curlExample = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${JSON.stringify(endpoint.requestBody, null, 2)}'` : ""}`;

  const jsExample = `const response = await fetch("${baseUrl}${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },${endpoint.requestBody ? `
  body: JSON.stringify(${JSON.stringify(endpoint.requestBody, null, 4).split('\n').join('\n  ')}),` : ""}
});

const data = await response.json();`;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${methodColors[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className="text-sm font-mono text-gray-800 dark:text-gray-200">{endpoint.path}</code>
          {!endpoint.auth && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Public
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{endpoint.description}</span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:hidden">{endpoint.description}</p>

          {endpoint.queryParams && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Query Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Required</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.queryParams.map((param) => (
                      <tr key={param.name} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="py-2 pr-4 font-mono text-gray-800 dark:text-gray-200">{param.name}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{param.type}</td>
                        <td className="py-2 pr-4">
                          {param.required ? (
                            <span className="text-red-500">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.requestBody && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Request Body</h4>
              <CodeBlock code={JSON.stringify(endpoint.requestBody, null, 2)} />
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Response Example</h4>
              <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">cURL Example</h4>
            <CodeBlock code={curlExample} language="bash" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">JavaScript Example</h4>
            <CodeBlock code={jsExample} language="javascript" />
          </div>
        </div>
      )}
    </div>
  );
};

function ApiDocsContent() {
  const [activeCategory, setActiveCategory] = useState(apiCategories[0].name);
  const [baseUrl, setBaseUrl] = useState(API_BASE_URL);

  useEffect(() => {
    // Use window location if NEXT_PUBLIC_APP_URL is not set
    if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_APP_URL) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const activeEndpoints = apiCategories.find((c) => c.name === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-lg">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">API Documentation</h1>
            <p className="text-gray-500 dark:text-gray-400">Integrate with our REST API</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Base URL</p>
              <code className="text-sm text-brand-600 dark:text-brand-400">{baseUrl}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Authentication:</span>
              <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Start</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Get your API Key</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Go to <a href="/dashboard/settings/api" className="text-brand-500 hover:underline">Settings &gt; API Keys</a> to create an API key.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Make your first request</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Include your API key in the Authorization header:
              </p>
              <CodeBlock
                code={`curl -X GET "${baseUrl}/api/events" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Handle responses</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All responses are JSON. Successful requests return 2xx status codes. Errors include a message field.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">API Reference</h2>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Category Sidebar */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              {apiCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.name
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Endpoints */}
          <div className="flex-1 p-6">
            {activeEndpoints && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{activeEndpoints.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{activeEndpoints.description}</p>
                </div>

                <div className="space-y-3">
                  {activeEndpoints.endpoints.map((endpoint, idx) => (
                    <EndpointCard key={idx} endpoint={endpoint} baseUrl={baseUrl} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Rate Limits</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">Requests/Month</th>
                <th className="pb-3">Rate Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Free</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">1,000</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">10 req/min</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Starter</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">10,000</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">60 req/min</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Professional</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">50,000</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">120 req/min</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Business</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">Unlimited</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">600 req/min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Codes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Error Codes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">400</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Bad Request</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Invalid request body or parameters</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">401</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Unauthorized</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Missing or invalid API key</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">403</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Forbidden</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Insufficient permissions or plan limit reached</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">404</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Not Found</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Resource not found</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">429</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Too Many Requests</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Rate limit exceeded</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-mono text-xs">500</span></td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white">Server Error</td>
                <td className="py-3 text-gray-600 dark:text-gray-400">Internal server error</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
      <ApiDocsContent />
    </ProtectedPage>
  );
}
