"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Link from "next/link";
import { FeatureGate } from "@/components/ui/FeatureGate";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WorkflowEditorProps {
  workflowId: string;
}

interface NodeData {
  id: string;
  type: "trigger" | "action";
  action_type?: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface WorkflowRun {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
}

interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused";
  trigger_type: string;
  trigger_config: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TRIGGER_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "client_created", label: "Client Created" },
  { value: "client_status_changed", label: "Client Status Changed" },
  { value: "project_created", label: "Project Created" },
  { value: "project_status_changed", label: "Project Status Changed" },
  { value: "task_status_changed", label: "Task Status Changed" },
  { value: "task_created", label: "Task Created" },
  { value: "task_completed", label: "Task Completed" },
  { value: "lead_created", label: "Lead Created" },
  { value: "lead_status_changed", label: "Lead Status Changed" },
  { value: "contact_created", label: "Contact Created" },
  { value: "event_created", label: "Event Created" },
  { value: "event_registration", label: "Event Registration" },
  { value: "invoice_created", label: "Invoice Created" },
  { value: "invoice_overdue", label: "Invoice Overdue" },
  { value: "payment_received", label: "Payment Received" },
];

const ACTION_CATEGORIES = [
  {
    label: "Create",
    items: [
      { value: "create_task", label: "Create Task", icon: "clipboard", color: "bg-blue-500" },
      { value: "create_project", label: "Create Project", icon: "folder", color: "bg-cyan-500" },
      { value: "create_event", label: "Create Event", icon: "calendar", color: "bg-teal-500" },
      { value: "create_invoice", label: "Create Invoice", icon: "invoice", color: "bg-emerald-600" },
      { value: "create_client", label: "Create Client", icon: "client", color: "bg-sky-600" },
      { value: "create_lead", label: "Create Lead", icon: "lead", color: "bg-amber-500" },
      { value: "create_contact", label: "Create Contact", icon: "contact", color: "bg-rose-500" },
    ],
  },
  {
    label: "Notify",
    items: [
      { value: "send_notification", label: "Send Notification", icon: "bell", color: "bg-purple-500" },
      { value: "send_email", label: "Send Email", icon: "mail", color: "bg-red-500" },
      // { value: "send_sms", label: "Send SMS (Twilio)", icon: "phone", color: "bg-red-600" }, // Temporarily disabled
      { value: "send_slack", label: "Send Slack Message", icon: "slack", color: "bg-purple-600" },
      { value: "send_whatsapp", label: "Send WhatsApp", icon: "whatsapp", color: "bg-green-500" },
      { value: "send_banner", label: "Show Modal", icon: "banner", color: "bg-fuchsia-500" },
    ],
  },
  {
    label: "Update",
    items: [
      { value: "update_status", label: "Update Status", icon: "refresh", color: "bg-green-500" },
      { value: "update_field", label: "Update Field", icon: "edit", color: "bg-emerald-500" },
      { value: "assign_to", label: "Assign To", icon: "user", color: "bg-sky-500" },
      { value: "add_tag", label: "Add Tag", icon: "tag", color: "bg-pink-500" },
      { value: "remove_tag", label: "Remove Tag", icon: "tag_remove", color: "bg-pink-600" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { value: "elevenlabs_tts", label: "ElevenLabs TTS", icon: "elevenlabs", color: "bg-black" },
      { value: "openai_generate", label: "OpenAI Generate", icon: "openai", color: "bg-gray-900" },
      { value: "stripe_payment_link", label: "Stripe Payment Link", icon: "stripe", color: "bg-violet-600" },
      { value: "google_calendar_event", label: "Google Calendar Event", icon: "gcal", color: "bg-blue-600" },
      { value: "zapier_trigger", label: "Trigger Zapier Zap", icon: "zapier", color: "bg-orange-600" },
    ],
  },
  {
    label: "Control",
    items: [
      { value: "condition", label: "Condition", icon: "branch", color: "bg-orange-500" },
      { value: "approval", label: "Approval Gate", icon: "check", color: "bg-amber-500" },
      { value: "wait_delay", label: "Wait / Delay", icon: "clock", color: "bg-gray-500" },
      { value: "schedule_action", label: "Schedule Action", icon: "schedule", color: "bg-cyan-600" },
      { value: "webhook", label: "Webhook", icon: "globe", color: "bg-violet-500" },
      { value: "http_request", label: "HTTP Request", icon: "http", color: "bg-indigo-500" },
      { value: "log_activity", label: "Log Activity", icon: "log", color: "bg-slate-500" },
    ],
  },
];

const ALL_ACTION_TYPES = ACTION_CATEGORIES.flatMap((c) => c.items);

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const RUN_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  waiting_approval: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

/** Maps integration action types to their required provider name in tenant_integrations */
const ACTION_PROVIDER_MAP: Record<string, string> = {
  send_sms: "twilio",
  send_slack: "slack",
  send_whatsapp: "whatsapp",
  elevenlabs_tts: "elevenlabs",
  openai_generate: "openai",
  stripe_payment_link: "stripe",
  google_calendar_event: "google_calendar",
  zapier_trigger: "zapier",
};

const NODE_W = 240;
const NODE_H = 76;

/* ------------------------------------------------------------------ */
/*  Variable registry                                                  */
/* ------------------------------------------------------------------ */

const TRIGGER_VARIABLES: Record<string, { var: string; label: string; desc?: string }[]> = {
  _common: [
    { var: "entity_id", label: "Entity ID", desc: "Unique ID of the record that triggered this workflow (e.g. client UUID, task UUID)" },
    { var: "entity_type", label: "Entity type", desc: "What kind of record triggered it — client, task, project, lead, invoice, etc." },
    { var: "entity_name", label: "Entity name", desc: "Display name of the triggering record (e.g. client name, task title)" },
    { var: "now", label: "Current date/time", desc: "Timestamp when the workflow step executes, in ISO 8601 format" },
  ],
  task_status_changed: [
    { var: "from_status", label: "Previous status" },
    { var: "to_status", label: "New status" },
    { var: "task_title", label: "Task title" },
    { var: "task_assignee_id", label: "Assignee ID" },
    { var: "task_project_id", label: "Project ID" },
  ],
  task_created: [
    { var: "task_title", label: "Task title" },
    { var: "task_assignee_id", label: "Assignee ID" },
    { var: "task_project_id", label: "Project ID" },
  ],
  task_completed: [
    { var: "task_title", label: "Task title" },
    { var: "task_assignee_id", label: "Assignee ID" },
    { var: "task_project_id", label: "Project ID" },
  ],
  project_status_changed: [
    { var: "from_status", label: "Previous status" },
    { var: "to_status", label: "New status" },
    { var: "project_name", label: "Project name" },
  ],
  lead_created: [
    { var: "lead_name", label: "Lead name" },
    { var: "lead_email", label: "Lead email" },
    { var: "lead_company", label: "Lead company" },
  ],
  lead_status_changed: [
    { var: "from_status", label: "Previous status" },
    { var: "to_status", label: "New status" },
    { var: "lead_name", label: "Lead name" },
    { var: "lead_email", label: "Lead email" },
    { var: "lead_company", label: "Lead company" },
  ],
  client_created: [
    { var: "client_name", label: "Client name" },
    { var: "client_email", label: "Client email" },
    { var: "client_company", label: "Client company" },
  ],
  client_status_changed: [
    { var: "from_status", label: "Previous status" },
    { var: "to_status", label: "New status" },
    { var: "client_name", label: "Client name" },
    { var: "client_email", label: "Client email" },
    { var: "client_company", label: "Client company" },
  ],
  contact_created: [
    { var: "contact_first_name", label: "First name" },
    { var: "contact_last_name", label: "Last name" },
    { var: "contact_email", label: "Email" },
    { var: "contact_phone", label: "Phone" },
    { var: "contact_company", label: "Company" },
  ],
  event_registration: [
    { var: "event_id", label: "Event ID" },
    { var: "event_title", label: "Event title" },
    { var: "event_type", label: "Event type" },
    { var: "attendee_id", label: "Attendee ID" },
    { var: "attendee_name", label: "Attendee name" },
    { var: "attendee_email", label: "Attendee email" },
    { var: "attendee_phone", label: "Attendee phone" },
    { var: "attendee_company", label: "Attendee company" },
  ],
  invoice_created: [
    { var: "invoice_amount", label: "Invoice amount" },
    { var: "invoice_number", label: "Invoice number" },
    { var: "client_name", label: "Client name" },
  ],
  invoice_overdue: [
    { var: "invoice_amount", label: "Invoice amount" },
    { var: "invoice_number", label: "Invoice number" },
    { var: "client_name", label: "Client name" },
    { var: "days_overdue", label: "Days overdue" },
  ],
  payment_received: [
    { var: "payment_amount", label: "Payment amount" },
    { var: "payment_method", label: "Payment method" },
    { var: "client_name", label: "Client name" },
  ],
};

const STEP_OUTPUT_VARIABLES: Record<string, { var: string; label: string; desc?: string }[]> = {
  stripe_payment_link: [
    { var: "payment_link_url", label: "Payment link URL" },
    { var: "payment_link_id", label: "Payment link ID" },
  ],
  create_task: [{ var: "created_task_id", label: "Created task ID" }],
  create_project: [{ var: "created_project_id", label: "Created project ID" }],
  create_event: [{ var: "created_event_id", label: "Created event ID" }],
  create_invoice: [{ var: "created_invoice_id", label: "Created invoice ID" }],
  create_client: [{ var: "created_client_id", label: "Created client ID" }],
  create_lead: [{ var: "created_lead_id", label: "Created lead ID" }],
  openai_generate: [{ var: "ai_response", label: "AI response text" }],
  elevenlabs_tts: [{ var: "audio_url", label: "Audio file URL" }],
};

function getVariablesForTrigger(triggerType: string) {
  return [...(TRIGGER_VARIABLES._common || []), ...(TRIGGER_VARIABLES[triggerType] || [])];
}

/** Walk connections backwards to find all nodes that precede a given node */
function getPrecedingNodes(nodeId: string, nodes: NodeData[], connections: Connection[]): NodeData[] {
  const visited = new Set<string>();
  const result: NodeData[] = [];
  function walk(id: string) {
    for (const c of connections) {
      if (c.to === id && !visited.has(c.from)) {
        visited.add(c.from);
        const node = nodes.find((n) => n.id === c.from);
        if (node && node.type === "action") result.push(node);
        walk(c.from);
      }
    }
  }
  walk(nodeId);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function actionMeta(type: string) {
  return ALL_ACTION_TYPES.find((a) => a.value === type);
}

function actionLabel(type: string) {
  return actionMeta(type)?.label ?? type;
}
function actionColor(type: string) {
  return actionMeta(type)?.color ?? "bg-gray-500";
}

function triggerLabel(type: string) {
  return TRIGGER_TYPES.find((t) => t.value === type)?.label ?? type;
}

/** Topological sort starting from trigger, returns ordered node ids */
function topoSort(triggerId: string, nodes: NodeData[], connections: Connection[]): string[] {
  const adj = new Map<string, string[]>();
  for (const c of connections) {
    if (!adj.has(c.from)) adj.set(c.from, []);
    adj.get(c.from)!.push(c.to);
  }
  const visited = new Set<string>();
  const order: string[] = [];
  function dfs(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    order.push(id);
    for (const next of adj.get(id) ?? []) dfs(next);
  }
  dfs(triggerId);
  for (const n of nodes) {
    if (!visited.has(n.id) && n.type === "action") {
      order.push(n.id);
    }
  }
  return order;
}

function nodesToSteps(
  triggerId: string,
  nodes: NodeData[],
  connections: Connection[]
): { step_order: number; step_type: string; config: Record<string, unknown> }[] {
  const sorted = topoSort(triggerId, nodes, connections);
  const steps: { step_order: number; step_type: string; config: Record<string, unknown> }[] = [];
  let order = 1;
  for (const id of sorted) {
    const node = nodes.find((n) => n.id === id);
    if (!node || node.type === "trigger") continue;
    steps.push({
      step_order: order++,
      step_type: node.action_type || "create_task",
      config: node.config,
    });
  }
  return steps;
}

function stepsToNodes(
  triggerType: string,
  triggerConfig: Record<string, unknown>,
  steps: { id?: string; step_order: number; step_type: string; config: Record<string, unknown> }[],
  graphLayout?: {
    positions?: { id: string; x: number; y: number }[];
    connections?: { id: string; from: string; to: string }[];
    nodeIdMap?: { nodeId: string; stepIndex: number }[];
  } | null
): { nodes: NodeData[]; connections: Connection[] } {
  const CANVAS_CENTER_X = 400;
  const START_Y = 60;
  const GAP_Y = 130;

  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  // Build a mapping from saved nodeId to step index so we can match positions.
  // Steps get new DB UUIDs on every save, so we use nodeIdMap to bridge
  // old IDs (in graph_layout) to the new step IDs from the database.
  const savedNodeIdByIndex = new Map<number, string>();
  if (graphLayout?.nodeIdMap) {
    for (const entry of graphLayout.nodeIdMap) {
      savedNodeIdByIndex.set(entry.stepIndex, entry.nodeId);
    }
  }

  // Build position lookup from saved layout (keyed by old node IDs)
  const savedPositions = new Map<string, { x: number; y: number }>();
  if (graphLayout?.positions) {
    for (const p of graphLayout.positions) {
      savedPositions.set(p.id, { x: p.x, y: p.y });
    }
  }

  const triggerPos = savedPositions.get("trigger");
  const triggerNode: NodeData = {
    id: "trigger",
    type: "trigger",
    config: triggerConfig ?? {},
    x: triggerPos?.x ?? CANVAS_CENTER_X - NODE_W / 2,
    y: triggerPos?.y ?? START_Y,
  };

  // Build old-to-new ID mapping: the DB assigns fresh UUIDs each save,
  // so we remap old IDs from graph_layout to the new step IDs.
  const oldToNewId = new Map<string, string>();
  oldToNewId.set("trigger", "trigger");

  const actionNodes: NodeData[] = sorted.map((s, i) => {
    const newId = s.id || uid();
    const oldId = savedNodeIdByIndex.get(i);

    // Map old saved ID → new database ID
    if (oldId) {
      oldToNewId.set(oldId, newId);
    }

    // Look up position by old ID (what graph_layout stored)
    const pos = oldId ? savedPositions.get(oldId) : undefined;
    return {
      id: newId,
      type: "action" as const,
      action_type: s.step_type,
      config: s.config ?? {},
      x: pos?.x ?? CANVAS_CENTER_X - NODE_W / 2,
      y: pos?.y ?? START_Y + (i + 1) * GAP_Y,
    };
  });

  const allNodes = [triggerNode, ...actionNodes];
  const allNodeIds = new Set(allNodes.map((n) => n.id));

  // Restore saved connections, remapping old IDs to new IDs
  if (graphLayout?.connections && graphLayout.connections.length > 0) {
    const connections: Connection[] = [];
    for (const c of graphLayout.connections) {
      const from = oldToNewId.get(c.from) ?? c.from;
      const to = oldToNewId.get(c.to) ?? c.to;
      if (allNodeIds.has(from) && allNodeIds.has(to)) {
        connections.push({ id: uid(), from, to });
      }
    }

    if (connections.length > 0) {
      return { nodes: allNodes, connections };
    }
  }

  // Fallback: auto-connect in linear chain (legacy behavior for old workflows)
  const connections: Connection[] = [];
  for (let i = 0; i < allNodes.length - 1; i++) {
    connections.push({ id: uid(), from: allNodes[i].id, to: allNodes[i + 1].id });
  }

  return { nodes: allNodes, connections };
}

/* ------------------------------------------------------------------ */
/*  SVG connection path                                                */
/* ------------------------------------------------------------------ */

function connectionPath(from: NodeData, to: NodeData): string {
  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y;
  const dy = Math.abs(y2 - y1);
  const cy = Math.max(dy * 0.45, 40);
  return `M ${x1} ${y1} C ${x1} ${y1 + cy}, ${x2} ${y2 - cy}, ${x2} ${y2}`;
}

/* ------------------------------------------------------------------ */
/*  Action icon                                                        */
/* ------------------------------------------------------------------ */

function ActionIcon({ type, size = 16 }: { type: string; size?: number }) {
  const p = { width: size, height: size, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "create_task": return <svg {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case "create_project": return <svg {...p}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
    case "create_event": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "send_notification": return <svg {...p}><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    case "send_email": return <svg {...p}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case "update_status": return <svg {...p}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
    case "update_field": return <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case "assign_to": return <svg {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    case "add_tag": return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case "condition": return <svg {...p}><polyline points="6 3 6 15 18 15" /><path d="M6 9l6-6 6 6" /></svg>;
    case "approval": return <svg {...p}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "wait_delay": return <svg {...p}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "webhook": return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
    case "send_sms": return <svg {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>;
    case "send_slack": return <svg {...p}><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" /><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" /><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" /><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" /><path d="M14 20.5c0-.83.67-1.5 1.5-1.5h0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h0c-.83 0-1.5-.67-1.5-1.5z" /><path d="M10 9.5c0 .83-.67 1.5-1.5 1.5h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z" /><path d="M10 3.5C10 4.33 9.33 5 8.5 5h0C7.67 5 7 4.33 7 3.5S7.67 2 8.5 2h0c.83 0 1.5.67 1.5 1.5z" /></svg>;
    case "send_whatsapp": return <svg {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>;
    case "http_request": return <svg {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>;
    case "log_activity": return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>;
    case "elevenlabs_tts": return <svg {...p}><rect x="6" y="3" width="3" height="18" rx="1" /><rect x="15" y="3" width="3" height="18" rx="1" /></svg>;
    case "openai_generate": return <svg {...p}><path d="M12 2a10 10 0 00-6.88 17.23l-.71 3.47 3.47-.71A10 10 0 1012 2z" /><path d="M8 12h8M8 8h8M8 16h4" /></svg>;
    case "stripe_payment_link": return <svg {...p}><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" /><path d="M2 10h20" /><path d="M6 14h4" /></svg>;
    case "google_calendar_event": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
    case "zapier_trigger": return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
    case "create_invoice": return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>;
    case "create_client": return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>;
    case "create_lead": return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
    case "create_contact": return <svg {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    case "send_banner": return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><path d="M7 8h10M7 12h6" /></svg>;
    case "remove_tag": return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /><line x1="10" y1="15" x2="16" y2="9" /></svg>;
    case "schedule_action": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M12 14v3l2 1" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

/* ------------------------------------------------------------------ */
/*  Variable UI components                                             */
/* ------------------------------------------------------------------ */

function VariableTag({ name, label, desc, onInsert }: {
  name: string; label: string; desc?: string; onInsert: (v: string) => void;
}) {
  const [flash, setFlash] = useState<string | null>(null);
  return (
    <button
      type="button"
      onClick={() => {
        onInsert(`{{${name}}}`);
        setFlash("\u2713");
        setTimeout(() => setFlash(null), 1500);
      }}
      title={desc ? `${label} — ${desc}` : label}
      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50
                 px-1.5 py-0.5 text-[11px] font-mono text-blue-700 transition-all
                 hover:bg-blue-100 hover:border-blue-300 cursor-pointer
                 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300
                 dark:hover:bg-blue-900/50"
    >
      {flash ? (
        <span className="text-green-600 dark:text-green-400 font-sans">{flash}</span>
      ) : (
        <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
      <span>{`{{${name}}}`}</span>
    </button>
  );
}

function VariablePalette({ triggerType, nodes, connections, currentNodeId, onInsert }: {
  triggerType: string;
  nodes: NodeData[];
  connections: Connection[];
  currentNodeId: string;
  onInsert: (v: string) => void;
}) {
  const triggerVars = getVariablesForTrigger(triggerType);

  const precedingSteps = getPrecedingNodes(currentNodeId, nodes, connections);
  const stepOutputVars: { var: string; label: string; desc?: string; from: string }[] = [];
  for (const n of precedingSteps) {
    const outputs = STEP_OUTPUT_VARIABLES[n.action_type || ""];
    if (outputs) {
      for (const o of outputs) {
        stepOutputVars.push({ ...o, from: actionLabel(n.action_type || "") });
      }
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Variables</p>
        <span className="text-[10px] text-gray-400 ml-auto">Hover for info, click to insert</span>
      </div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
        {triggerLabel(triggerType)} Trigger
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        {triggerVars.map((v) => (
          <VariableTag key={v.var} name={v.var} label={v.label} desc={v.desc} onInsert={onInsert} />
        ))}
      </div>
      {stepOutputVars.length > 0 && (
        <>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 mt-2">
            From Previous Steps
          </p>
          <div className="flex flex-wrap gap-1">
            {stepOutputVars.map((v) => (
              <VariableTag key={v.var} name={v.var} label={`${v.label} (${v.from})`} desc={v.desc} onInsert={onInsert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Node config panel                                                  */
/* ------------------------------------------------------------------ */

interface EventOption {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string | null;
  status: string | null;
}

function NodeConfigPanel({
  node,
  triggerType,
  triggerConfig,
  events,
  nodes,
  connections,
  actionCategories,
  onUpdateConfig,
  onUpdateTrigger,
  onChangeActionType,
  onDelete,
  onClose,
}: {
  node: NodeData;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  events: EventOption[];
  nodes: NodeData[];
  connections: Connection[];
  actionCategories: typeof ACTION_CATEGORIES;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onUpdateTrigger: (type: string, config: Record<string, unknown>) => void;
  onChangeActionType: (nodeId: string, newType: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const labelClass =
    "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

  const update = (key: string, value: unknown) =>
    onUpdateConfig({ ...node.config, [key]: value });

  /* ---- Focus tracking for variable insertion ---- */
  const focusedElRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const focusedKeyRef = useRef<string | null>(null);

  function handleInsertVariable(varStr: string) {
    const el = focusedElRef.current;
    if (el && focusedKeyRef.current) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const newVal = el.value.slice(0, start) + varStr + el.value.slice(end);
      update(focusedKeyRef.current, newVal);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + varStr.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      navigator.clipboard.writeText(varStr);
    }
  }

  function trackFocus(key: string) {
    return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      focusedElRef.current = e.target;
      focusedKeyRef.current = key;
    };
  }

  /* ---- Trigger config ---- */
  if (node.type === "trigger") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Trigger Configuration</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div>
          <label className={labelClass}>Trigger Type</label>
          <select className={inputClass} value={triggerType} onChange={(e) => onUpdateTrigger(e.target.value, triggerConfig)}>
            {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {/* --- Trigger-specific config panels --- */}
        {triggerType === "task_status_changed" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>From Status</label>
              <select className={inputClass} value={(triggerConfig.from_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, from_status: e.target.value })}>
                <option value="">Any</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>To Status</label>
              <select className={inputClass} value={(triggerConfig.to_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, to_status: e.target.value })}>
                <option value="">Any</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        )}
        {triggerType === "project_status_changed" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>From Status</label>
              <select className={inputClass} value={(triggerConfig.from_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, from_status: e.target.value })}>
                <option value="">Any</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>To Status</label>
              <select className={inputClass} value={(triggerConfig.to_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, to_status: e.target.value })}>
                <option value="">Any</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
        {triggerType === "lead_status_changed" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>From Status</label>
              <select className={inputClass} value={(triggerConfig.from_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, from_status: e.target.value })}>
                <option value="">Any</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>To Status</label>
              <select className={inputClass} value={(triggerConfig.to_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, to_status: e.target.value })}>
                <option value="">Any</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        )}
        {triggerType === "client_status_changed" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>From Status</label>
              <select className={inputClass} value={(triggerConfig.from_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, from_status: e.target.value })}>
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>To Status</label>
              <select className={inputClass} value={(triggerConfig.to_status as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, to_status: e.target.value })}>
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}
        {triggerType === "lead_created" && (
          <div>
            <label className={labelClass}>Source Filter</label>
            <select className={inputClass} value={(triggerConfig.source as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, source: e.target.value })}>
              <option value="">Any Source</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="advertisement">Advertisement</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}
        {triggerType === "task_created" && (
          <div>
            <label className={labelClass}>Priority Filter</label>
            <select className={inputClass} value={(triggerConfig.priority as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, priority: e.target.value })}>
              <option value="">Any Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        )}
        {triggerType === "event_registration" && (
          <>
            <div>
              <label className={labelClass}>Specific Event</label>
              <select className={inputClass} value={(triggerConfig.event_id as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, event_id: e.target.value || undefined })}>
                <option value="">Any Event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}{ev.event_type ? ` (${ev.event_type})` : ""}{ev.status ? ` — ${ev.status}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Choose a specific event, or leave as &ldquo;Any Event&rdquo; to trigger on all registrations.</p>
            </div>
            <div>
              <label className={labelClass}>Event Type Filter</label>
              <select className={inputClass} value={(triggerConfig.event_type as string) || ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, event_type: e.target.value || undefined })}>
                <option value="">Any Event Type</option>
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="webinar">Webinar</option>
                <option value="hackathon">Hackathon</option>
              </select>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Only triggers when the event matches this type. Ignored if a specific event is selected above.</p>
            </div>
          </>
        )}
        {triggerType === "payment_received" && (
          <div>
            <label className={labelClass}>Minimum Amount</label>
            <input className={inputClass} type="number" min={0} step="0.01" value={(triggerConfig.min_amount as number) ?? ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, min_amount: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 100 (leave empty for any)" />
          </div>
        )}
        {triggerType === "invoice_overdue" && (
          <div>
            <label className={labelClass}>Minimum Days Overdue</label>
            <input className={inputClass} type="number" min={1} value={(triggerConfig.min_days_overdue as number) ?? ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, min_days_overdue: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 7" />
          </div>
        )}
        {triggerType === "invoice_created" && (
          <div>
            <label className={labelClass}>Minimum Amount</label>
            <input className={inputClass} type="number" min={0} step="0.01" value={(triggerConfig.min_amount as number) ?? ""} onChange={(e) => onUpdateTrigger(triggerType, { ...triggerConfig, min_amount: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 500 (leave empty for any)" />
          </div>
        )}

        <VariablePalette
          triggerType={triggerType}
          nodes={nodes}
          connections={connections}
          currentNodeId={node.id}
          onInsert={(v) => navigator.clipboard.writeText(v)}
        />
      </div>
    );
  }

  /* ---- Action node config ---- */
  const at = node.action_type || "create_task";

  const renderFields = () => {
    switch (at) {
      case "create_task":
        return (
          <>
            <div><label className={labelClass}>Task Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} onFocus={trackFocus("title")} placeholder="e.g. Welcome Call" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} onFocus={trackFocus("description")} placeholder="Task description (supports {{entity_id}})" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Priority</label><select className={inputClass} value={(node.config.priority as string) || "medium"} onChange={(e) => update("priority", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              <div><label className={labelClass}>Due (days)</label><input className={inputClass} type="number" min={0} value={(node.config.due_date_offset_days as number) ?? ""} onChange={(e) => update("due_date_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 3" /></div>
            </div>
          </>
        );
      case "create_project":
        return (
          <>
            <div><label className={labelClass}>Project Name</label><input className={inputClass} value={(node.config.name as string) ?? ""} onChange={(e) => update("name", e.target.value)} onFocus={trackFocus("name")} placeholder="e.g. Client Onboarding" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} onFocus={trackFocus("description")} placeholder="Project description" /></div>
            <div><label className={labelClass}>Initial Status</label><select className={inputClass} value={(node.config.status as string) || "planning"} onChange={(e) => update("status", e.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On Hold</option></select></div>
          </>
        );
      case "create_event":
        return (
          <>
            <div><label className={labelClass}>Event Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} onFocus={trackFocus("title")} placeholder="e.g. Kickoff Meeting" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} onFocus={trackFocus("description")} placeholder="Event description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Type</label><select className={inputClass} value={(node.config.event_type as string) || "general"} onChange={(e) => update("event_type", e.target.value)}><option value="general">General</option><option value="meeting">Meeting</option><option value="conference">Conference</option><option value="workshop">Workshop</option></select></div>
              <div><label className={labelClass}>Start (days)</label><input className={inputClass} type="number" min={0} value={(node.config.start_date_offset_days as number) ?? ""} onChange={(e) => update("start_date_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 7" /></div>
            </div>
          </>
        );
      case "send_notification":
        return (
          <>
            <div><label className={labelClass}>Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} onFocus={trackFocus("title")} placeholder="Notification title" /></div>
            <div><label className={labelClass}>Message</label><textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} onFocus={trackFocus("message")} placeholder="Notification message (supports {{entity_id}})" /></div>
            <div><label className={labelClass}>Action URL (optional)</label><input className={inputClass} value={(node.config.action_url as string) ?? ""} onChange={(e) => update("action_url", e.target.value)} onFocus={trackFocus("action_url")} placeholder="/dashboard/..." /></div>
          </>
        );
      case "send_email":
        return (
          <>
            <div><label className={labelClass}>To (Email)</label><input className={inputClass} type="email" value={(node.config.to as string) ?? ""} onChange={(e) => update("to", e.target.value)} onFocus={trackFocus("to")} placeholder="recipient@example.com or {{variable}}" /></div>
            <div><label className={labelClass}>Subject</label><input className={inputClass} value={(node.config.subject as string) ?? ""} onChange={(e) => update("subject", e.target.value)} onFocus={trackFocus("subject")} placeholder="Email subject" /></div>
            <div><label className={labelClass}>Body</label><textarea className={inputClass} rows={3} value={(node.config.body as string) ?? ""} onChange={(e) => update("body", e.target.value)} onFocus={trackFocus("body")} placeholder="Email body" /></div>
          </>
        );
      case "update_status":
        return (
          <>
            <div><label className={labelClass}>Entity Type</label><select className={inputClass} value={(node.config.entity_type as string) || ""} onChange={(e) => update("entity_type", e.target.value)}><option value="">Use trigger entity</option><option value="task">Task</option><option value="project">Project</option><option value="event">Event</option></select></div>
            <div><label className={labelClass}>New Status</label><input className={inputClass} value={(node.config.new_status as string) ?? ""} onChange={(e) => update("new_status", e.target.value)} placeholder="e.g. completed, active" /></div>
          </>
        );
      case "update_field":
        return (
          <>
            <div><label className={labelClass}>Entity Type</label><select className={inputClass} value={(node.config.entity_type as string) || ""} onChange={(e) => update("entity_type", e.target.value)}><option value="">Use trigger entity</option><option value="task">Task</option><option value="project">Project</option><option value="event">Event</option></select></div>
            <div><label className={labelClass}>Field Name</label><input className={inputClass} value={(node.config.field_name as string) ?? ""} onChange={(e) => update("field_name", e.target.value)} placeholder="e.g. priority, description" /></div>
            <div><label className={labelClass}>New Value</label><input className={inputClass} value={(node.config.field_value as string) ?? ""} onChange={(e) => update("field_value", e.target.value)} placeholder="The new value" /></div>
          </>
        );
      case "assign_to":
        return (
          <>
            <div><label className={labelClass}>Entity Type</label><select className={inputClass} value={(node.config.entity_type as string) || ""} onChange={(e) => update("entity_type", e.target.value)}><option value="">Use trigger entity</option><option value="task">Task</option><option value="project">Project</option><option value="event">Event</option></select></div>
            <div><label className={labelClass}>Assignee ID</label><input className={inputClass} value={(node.config.assignee_id as string) ?? ""} onChange={(e) => update("assignee_id", e.target.value)} placeholder="User UUID" /></div>
            <div><label className={labelClass}>Notification Message</label><input className={inputClass} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} placeholder="Optional assignment message" /></div>
          </>
        );
      case "add_tag":
        return (
          <>
            <div><label className={labelClass}>Entity Type</label><select className={inputClass} value={(node.config.entity_type as string) || ""} onChange={(e) => update("entity_type", e.target.value)}><option value="">Use trigger entity</option><option value="task">Task</option><option value="project">Project</option><option value="event">Event</option></select></div>
            <div><label className={labelClass}>Tag</label><input className={inputClass} value={(node.config.tag as string) ?? ""} onChange={(e) => update("tag", e.target.value)} placeholder="e.g. urgent, vip, onboarding" /></div>
          </>
        );
      case "condition":
        return (
          <>
            <div><label className={labelClass}>Context Field</label><input className={inputClass} value={(node.config.condition_field as string) ?? ""} onChange={(e) => update("condition_field", e.target.value)} placeholder="e.g. entity_type, to_status" /></div>
            <div><label className={labelClass}>Operator</label><select className={inputClass} value={(node.config.condition_operator as string) || "equals"} onChange={(e) => update("condition_operator", e.target.value)}><option value="equals">Equals</option><option value="not_equals">Not Equals</option><option value="contains">Contains</option><option value="not_empty">Not Empty</option><option value="is_empty">Is Empty</option></select></div>
            {!["not_empty", "is_empty"].includes((node.config.condition_operator as string) || "") && (
              <div><label className={labelClass}>Value</label><input className={inputClass} value={(node.config.condition_value as string) ?? ""} onChange={(e) => update("condition_value", e.target.value)} placeholder="Value to compare" /></div>
            )}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-xs text-amber-700 dark:text-amber-300">If the condition is not met, the workflow will stop and skip remaining steps.</p>
            </div>
          </>
        );
      case "approval":
        return (
          <div><label className={labelClass}>Instructions</label><textarea className={inputClass} rows={3} value={(node.config.instructions as string) ?? ""} onChange={(e) => update("instructions", e.target.value)} placeholder="Instructions for the approver" /></div>
        );
      case "wait_delay":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Duration</label><input className={inputClass} type="number" min={1} value={(node.config.duration as number) ?? ""} onChange={(e) => update("duration", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2" /></div>
            <div><label className={labelClass}>Unit</label><select className={inputClass} value={(node.config.unit as string) || "hours"} onChange={(e) => update("unit", e.target.value)}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
          </div>
        );
      case "webhook":
        return (
          <>
            <div><label className={labelClass}>URL</label><input className={inputClass} value={(node.config.url as string) ?? ""} onChange={(e) => update("url", e.target.value)} placeholder="https://api.example.com/webhook" /></div>
            <div><label className={labelClass}>Method</label><select className={inputClass} value={(node.config.method as string) || "POST"} onChange={(e) => update("method", e.target.value)}><option value="POST">POST</option><option value="GET">GET</option><option value="PUT">PUT</option></select></div>
            <div><label className={labelClass}>Auth Header (optional)</label><input className={inputClass} value={(node.config.auth_header as string) ?? ""} onChange={(e) => update("auth_header", e.target.value)} placeholder="Bearer token..." /></div>
          </>
        );

      /* ---- Integration actions ---- */

      case "send_sms":
        return (
          <>
            <div>
              <label className={labelClass}>Recipient Phone Number</label>
              <input className={inputClass} value={(node.config.phone_number as string) ?? ""} onChange={(e) => update("phone_number", e.target.value)} onFocus={trackFocus("phone_number")} placeholder="+1234567890" />
              <p className="mt-1 text-xs text-gray-400">International format with country code (e.g. +1 for US). Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{phone}}"}</code> to use the trigger entity&apos;s phone number.</p>
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} onFocus={trackFocus("message")} placeholder="Hi! Your task has been created." />
              <p className="mt-1 text-xs text-gray-400">The SMS body text. Supports template variables.</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Twilio Integration</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Uses your Twilio credentials from <strong>Settings &rarr; Integrations</strong>. If not configured, falls back to environment variables.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      case "send_slack":
        return (
          <>
            <div>
              <label className={labelClass}>Message</label>
              <textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} onFocus={trackFocus("message")} placeholder="New client created: {{entity_name}}" />
              <p className="mt-1 text-xs text-gray-400">The message to post. Supports Slack markdown and template variables.</p>
            </div>
            <div>
              <label className={labelClass}>Channel (optional)</label>
              <input className={inputClass} value={(node.config.channel as string) ?? ""} onChange={(e) => update("channel", e.target.value)} placeholder="#general" />
              <p className="mt-1 text-xs text-gray-400">Overrides the default channel set in your Slack integration. Leave blank to use the default.</p>
            </div>
            <div>
              <label className={labelClass}>Webhook URL (optional override)</label>
              <input className={inputClass} value={(node.config.webhook_url as string) ?? ""} onChange={(e) => update("webhook_url", e.target.value)} placeholder="https://hooks.slack.com/services/..." />
              <p className="mt-1 text-xs text-gray-400">Only set this to use a different webhook than your integration settings.</p>
            </div>
            <div>
              <label className={labelClass}>Mention</label>
              <select className={inputClass} value={(node.config.mention as string) || "none"} onChange={(e) => update("mention", e.target.value)}>
                <option value="none">No mention</option>
                <option value="channel">@channel &mdash; Notify everyone</option>
                <option value="here">@here &mdash; Notify active members</option>
              </select>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Slack Integration</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Uses your Slack Webhook URL from <strong>Settings &rarr; Integrations</strong>.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      case "send_whatsapp":
        return (
          <>
            <div>
              <label className={labelClass}>Recipient Phone Number</label>
              <input className={inputClass} value={(node.config.phone_number as string) ?? ""} onChange={(e) => update("phone_number", e.target.value)} onFocus={trackFocus("phone_number")} placeholder="+1234567890" />
              <p className="mt-1 text-xs text-gray-400">WhatsApp number in international format. Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{phone}}"}</code> to use the trigger entity&apos;s phone.</p>
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} onFocus={trackFocus("message")} placeholder="Hello! Your appointment is confirmed." />
              <p className="mt-1 text-xs text-gray-400">The WhatsApp message body. Supports template variables.</p>
            </div>
            <div>
              <label className={labelClass}>Template Name (optional)</label>
              <input className={inputClass} value={(node.config.template_name as string) ?? ""} onChange={(e) => update("template_name", e.target.value)} placeholder="appointment_reminder" />
              <p className="mt-1 text-xs text-gray-400">If using WhatsApp approved message templates, enter the template name here.</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">WhatsApp Integration</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Uses your WhatsApp Business API credentials from <strong>Settings &rarr; Integrations</strong>.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      case "http_request":
        return (
          <>
            <div>
              <label className={labelClass}>URL</label>
              <input className={inputClass} value={(node.config.url as string) ?? ""} onChange={(e) => update("url", e.target.value)} onFocus={trackFocus("url")} placeholder="https://api.example.com/endpoint" />
              <p className="mt-1 text-xs text-gray-400">The full URL to send the request to. Supports template variables in the URL.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Method</label>
                <select className={inputClass} value={(node.config.method as string) || "POST"} onChange={(e) => update("method", e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Content Type</label>
                <select className={inputClass} value={(node.config.content_type as string) || "application/json"} onChange={(e) => update("content_type", e.target.value)}>
                  <option value="application/json">JSON</option>
                  <option value="application/x-www-form-urlencoded">Form URL Encoded</option>
                  <option value="text/plain">Plain Text</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Authorization Header (optional)</label>
              <input className={inputClass} type="password" value={(node.config.auth_header as string) ?? ""} onChange={(e) => update("auth_header", e.target.value)} placeholder="Bearer your-api-key" />
              <p className="mt-1 text-xs text-gray-400">Sent as the <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">Authorization</code> header.</p>
            </div>
            <div>
              <label className={labelClass}>Custom Headers JSON (optional)</label>
              <textarea className={inputClass} rows={2} value={(node.config.headers_json as string) ?? ""} onChange={(e) => update("headers_json", e.target.value)} placeholder='{"X-API-Key": "abc123"}' />
              <p className="mt-1 text-xs text-gray-400">Additional headers as a JSON object.</p>
            </div>
            <div>
              <label className={labelClass}>Request Body JSON (optional)</label>
              <textarea className={inputClass} rows={3} value={(node.config.body_json as string) ?? ""} onChange={(e) => update("body_json", e.target.value)} onFocus={trackFocus("body_json")} placeholder='{"client_id": "{{entity_id}}"}' />
              <p className="mt-1 text-xs text-gray-400">For POST/PUT/PATCH. If empty, the full trigger context is sent automatically.</p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      case "log_activity":
        return (
          <>
            <div>
              <label className={labelClass}>Activity Type</label>
              <select className={inputClass} value={(node.config.activity_type as string) || "note"} onChange={(e) => update("activity_type", e.target.value)}>
                <option value="note">Note</option>
                <option value="status_change">Status Change</option>
                <option value="assignment">Assignment</option>
                <option value="milestone">Milestone</option>
                <option value="alert">Alert</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">Categorizes the activity log entry for filtering.</p>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea className={inputClass} rows={3} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} onFocus={trackFocus("description")} placeholder="Client {{entity_name}} was onboarded successfully" />
              <p className="mt-1 text-xs text-gray-400">The activity log message. Supports template variables.</p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      /* ---- Create: Invoice ---- */
      case "create_invoice":
        return (
          <>
            <div><label className={labelClass}>Amount</label><input className={inputClass} type="number" min={0} step="0.01" value={(node.config.amount as number) ?? ""} onChange={(e) => update("amount", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 500.00" /></div>
            <div><label className={labelClass}>Client ID</label><input className={inputClass} value={(node.config.client_id as string) ?? ""} onChange={(e) => update("client_id", e.target.value)} placeholder="{{entity_id}} or specific UUID" /></div>
            <div><label className={labelClass}>Due Date (days from now)</label><input className={inputClass} type="number" min={0} value={(node.config.due_date_offset_days as number) ?? ""} onChange={(e) => update("due_date_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 30" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Invoice description" /></div>
          </>
        );

      /* ---- Create: Client ---- */
      case "create_client":
        return (
          <>
            <div><label className={labelClass}>Client Name</label><input className={inputClass} value={(node.config.name as string) ?? ""} onChange={(e) => update("name", e.target.value)} onFocus={trackFocus("name")} placeholder="e.g. {{lead_name}}" /></div>
            <div><label className={labelClass}>Email</label><input className={inputClass} value={(node.config.email as string) ?? ""} onChange={(e) => update("email", e.target.value)} onFocus={trackFocus("email")} placeholder="{{lead_email}}" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={(node.config.phone as string) ?? ""} onChange={(e) => update("phone", e.target.value)} onFocus={trackFocus("phone")} placeholder="{{phone}}" /></div>
              <div><label className={labelClass}>Company</label><input className={inputClass} value={(node.config.company as string) ?? ""} onChange={(e) => update("company", e.target.value)} onFocus={trackFocus("company")} placeholder="{{lead_company}}" /></div>
            </div>
          </>
        );

      /* ---- Create: Lead ---- */
      case "create_lead":
        return (
          <>
            <div><label className={labelClass}>Lead Name</label><input className={inputClass} value={(node.config.name as string) ?? ""} onChange={(e) => update("name", e.target.value)} onFocus={trackFocus("name")} placeholder="e.g. {{attendee_name}}" /></div>
            <div><label className={labelClass}>Email</label><input className={inputClass} value={(node.config.email as string) ?? ""} onChange={(e) => update("email", e.target.value)} onFocus={trackFocus("email")} placeholder="{{attendee_email}}" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Company</label><input className={inputClass} value={(node.config.company as string) ?? ""} onChange={(e) => update("company", e.target.value)} placeholder="Company name" /></div>
              <div><label className={labelClass}>Source</label><select className={inputClass} value={(node.config.source as string) || ""} onChange={(e) => update("source", e.target.value)}><option value="">Select</option><option value="website">Website</option><option value="referral">Referral</option><option value="event">Event</option><option value="social_media">Social Media</option><option value="other">Other</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Estimated Value</label><input className={inputClass} type="number" min={0} value={(node.config.estimated_value as number) ?? ""} onChange={(e) => update("estimated_value", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 5000" /></div>
              <div><label className={labelClass}>Initial Status</label><select className={inputClass} value={(node.config.status as string) || "new"} onChange={(e) => update("status", e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option></select></div>
            </div>
          </>
        );

      /* ---- Create: Contact ---- */
      case "create_contact":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>First Name</label><input className={inputClass} value={(node.config.first_name as string) ?? ""} onChange={(e) => update("first_name", e.target.value)} onFocus={trackFocus("first_name")} placeholder="{{attendee_first_name}}" /></div>
              <div><label className={labelClass}>Last Name</label><input className={inputClass} value={(node.config.last_name as string) ?? ""} onChange={(e) => update("last_name", e.target.value)} onFocus={trackFocus("last_name")} placeholder="{{attendee_last_name}}" /></div>
            </div>
            <div><label className={labelClass}>Email</label><input className={inputClass} value={(node.config.email as string) ?? ""} onChange={(e) => update("email", e.target.value)} onFocus={trackFocus("email")} placeholder="{{attendee_email}}" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Phone</label><input className={inputClass} value={(node.config.phone as string) ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number" /></div>
              <div><label className={labelClass}>Company</label><input className={inputClass} value={(node.config.company as string) ?? ""} onChange={(e) => update("company", e.target.value)} placeholder="Company name" /></div>
            </div>
            <div><label className={labelClass}>Job Title</label><input className={inputClass} value={(node.config.job_title as string) ?? ""} onChange={(e) => update("job_title", e.target.value)} placeholder="Job title" /></div>
          </>
        );

      /* ---- Notify: Send Banner ---- */
      case "send_banner":
        return (
          <>
            <div><label className={labelClass}>Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} onFocus={trackFocus("title")} placeholder="Modal title" /></div>
            <div><label className={labelClass}>Message</label><textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} onFocus={trackFocus("message")} placeholder="Modal message (supports {{variables}})" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Style</label>
                <select className={inputClass} value={(node.config.banner_type as string) || "info"} onChange={(e) => update("banner_type", e.target.value)}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error / Alert</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Recipient</label>
                <select className={inputClass} value={(node.config.recipient_type as string) || "trigger_user"} onChange={(e) => update("recipient_type", e.target.value)}>
                  <option value="trigger_user">Trigger User</option>
                  <option value="all_team">All Users</option>
                  <option value="specific_id">Specific User</option>
                </select>
              </div>
            </div>
            {(node.config.recipient_type as string) === "specific_id" && (
              <div><label className={labelClass}>User ID</label><input className={inputClass} value={(node.config.recipient_id as string) ?? ""} onChange={(e) => update("recipient_id", e.target.value)} placeholder="User UUID or {{variable}}" /></div>
            )}
            <div><label className={labelClass}>Button Text</label><input className={inputClass} value={(node.config.button_text as string) ?? ""} onChange={(e) => update("button_text", e.target.value)} placeholder="Got it (default)" /></div>
          </>
        );

      /* ---- Update: Remove Tag ---- */
      case "remove_tag":
        return (
          <>
            <div><label className={labelClass}>Entity Type</label><select className={inputClass} value={(node.config.entity_type as string) || ""} onChange={(e) => update("entity_type", e.target.value)}><option value="">Use trigger entity</option><option value="task">Task</option><option value="project">Project</option><option value="client">Client</option><option value="lead">Lead</option></select></div>
            <div><label className={labelClass}>Tag to Remove</label><input className={inputClass} value={(node.config.tag as string) ?? ""} onChange={(e) => update("tag", e.target.value)} placeholder="e.g. prospect, needs-review" /></div>
          </>
        );

      /* ---- Control: Schedule Action ---- */
      case "schedule_action":
        return (
          <>
            <div>
              <label className={labelClass}>Schedule Type</label>
              <select className={inputClass} value={(node.config.schedule_type as string) || "delay"} onChange={(e) => update("schedule_type", e.target.value)}>
                <option value="delay">Delay (relative)</option>
                <option value="specific_time">Specific Time</option>
              </select>
            </div>
            {((node.config.schedule_type as string) || "delay") === "delay" ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Delay Amount</label><input className={inputClass} type="number" min={1} value={(node.config.delay_amount as number) ?? ""} onChange={(e) => update("delay_amount", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2" /></div>
                <div><label className={labelClass}>Unit</label><select className={inputClass} value={(node.config.delay_unit as string) || "hours"} onChange={(e) => update("delay_unit", e.target.value)}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></select></div>
              </div>
            ) : (
              <div><label className={labelClass}>Execute At</label><input className={inputClass} type="time" value={(node.config.execute_at_time as string) ?? "09:00"} onChange={(e) => update("execute_at_time", e.target.value)} /></div>
            )}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-xs text-amber-700 dark:text-amber-300">The next step in the workflow will execute after the scheduled delay or at the specified time.</p>
            </div>
          </>
        );

      /* ---- Integration: ElevenLabs TTS → Phone Call ---- */
      case "elevenlabs_tts":
        return (
          <>
            <div>
              <label className={labelClass}>Text to Speak</label>
              <textarea className={inputClass} rows={3} value={(node.config.text as string) ?? ""} onChange={(e) => update("text", e.target.value)} onFocus={trackFocus("text")} placeholder="Hello {{entity_name}}, welcome aboard!" />
              <p className="mt-1 text-xs text-gray-400">The text that will be converted to speech using ElevenLabs AI voice.</p>
            </div>
            <div>
              <label className={labelClass}>Delivery Method</label>
              <select className={inputClass} value={(node.config.delivery_method as string) || "call"} onChange={(e) => update("delivery_method", e.target.value)}>
                <option value="call">Phone Call (via Twilio)</option>
                <option value="generate_only">Generate Only (no delivery)</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">Choose how the generated speech is delivered.</p>
            </div>
            {((node.config.delivery_method as string) || "call") === "call" && (
              <div>
                <label className={labelClass}>Recipient Phone Number</label>
                <input className={inputClass} value={(node.config.phone_number as string) ?? ""} onChange={(e) => update("phone_number", e.target.value)} placeholder="+1234567890" />
                <p className="mt-1 text-xs text-gray-400">The phone number to call. International format with country code. Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{phone}}"}</code> for the trigger entity&apos;s phone.</p>
              </div>
            )}
            <div>
              <label className={labelClass}>Voice ID (optional override)</label>
              <input className={inputClass} value={(node.config.voice_id as string) ?? ""} onChange={(e) => update("voice_id", e.target.value)} placeholder="Leave blank to use integration default" />
              <p className="mt-1 text-xs text-gray-400">Override the default voice from your ElevenLabs integration settings.</p>
            </div>
            <div>
              <label className={labelClass}>Model ID (optional override)</label>
              <input className={inputClass} value={(node.config.model_id as string) ?? ""} onChange={(e) => update("model_id", e.target.value)} placeholder="Leave blank to use integration default" />
              <p className="mt-1 text-xs text-gray-400">Override the default model (e.g. <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">eleven_multilingual_v2</code>).</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">ElevenLabs + Twilio Required</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                This step generates speech with ElevenLabs and calls the recipient via Twilio. Both integrations must be configured in <strong>Settings &rarr; Integrations</strong>.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      /* ---- Integration: OpenAI Generate ---- */
      case "openai_generate":
        return (
          <>
            <div>
              <label className={labelClass}>Prompt</label>
              <textarea className={inputClass} rows={4} value={(node.config.prompt as string) ?? ""} onChange={(e) => update("prompt", e.target.value)} onFocus={trackFocus("prompt")} placeholder="Write a welcome email for {{entity_name}} who just registered..." />
              <p className="mt-1 text-xs text-gray-400">The instruction sent to OpenAI. Supports template variables. The AI response is stored in the workflow context as <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{ai_response}}"}</code> for use in later steps.</p>
            </div>
            <div>
              <label className={labelClass}>Model (optional override)</label>
              <select className={inputClass} value={(node.config.model as string) || ""} onChange={(e) => update("model", e.target.value)}>
                <option value="">Use integration default</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>System Instructions (optional)</label>
              <textarea className={inputClass} rows={2} value={(node.config.system_prompt as string) ?? ""} onChange={(e) => update("system_prompt", e.target.value)} placeholder="You are a professional business assistant." />
              <p className="mt-1 text-xs text-gray-400">Sets the AI&apos;s persona and behavior. If blank, a generic assistant is used.</p>
            </div>
            <div>
              <label className={labelClass}>Max Tokens</label>
              <input className={inputClass} type="number" min={1} max={4096} value={(node.config.max_tokens as number) ?? ""} onChange={(e) => update("max_tokens", e.target.value ? Number(e.target.value) : null)} placeholder="500" />
              <p className="mt-1 text-xs text-gray-400">Maximum length of the AI response. Default: 500.</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">OpenAI Integration Required</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Configure your API key and default model in <strong>Settings &rarr; Integrations &rarr; OpenAI</strong>.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      /* ---- Integration: Stripe Payment Link ---- */
      case "stripe_payment_link":
        return (
          <>
            <div>
              <label className={labelClass}>Product Name</label>
              <input className={inputClass} value={(node.config.product_name as string) ?? ""} onChange={(e) => update("product_name", e.target.value)} placeholder="e.g. Consultation Fee" />
              <p className="mt-1 text-xs text-gray-400">Name displayed on the Stripe checkout page.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Amount (cents)</label>
                <input className={inputClass} type="number" min={1} value={(node.config.amount as number) ?? ""} onChange={(e) => update("amount", e.target.value ? Number(e.target.value) : null)} placeholder="5000 = $50.00" />
                <p className="mt-1 text-xs text-gray-400">e.g. 5000 = $50.00</p>
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select className={inputClass} value={(node.config.currency as string) || "usd"} onChange={(e) => update("currency", e.target.value)}>
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                  <option value="aed">AED</option>
                  <option value="aud">AUD</option>
                  <option value="cad">CAD</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Send Payment Link To</label>
              <input className={inputClass} type="email" value={(node.config.send_to as string) ?? ""} onChange={(e) => update("send_to", e.target.value)} onFocus={trackFocus("send_to")} placeholder="recipient@example.com or {{variable}}" />
              <p className="mt-1 text-xs text-gray-400">The payment link will be emailed to this address. Use <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{attendee_email}}"}</code>, <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{client_email}}"}</code>, etc.</p>
            </div>
            <div>
              <label className={labelClass}>Customer Email on Checkout (optional)</label>
              <input className={inputClass} value={(node.config.customer_email as string) ?? ""} onChange={(e) => update("customer_email", e.target.value)} placeholder="{{attendee_email}}" />
              <p className="mt-1 text-xs text-gray-400">Pre-fills the email on the Stripe checkout page.</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Stripe Integration Required</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                You must configure your Stripe Secret Key in <strong>Settings &rarr; Integrations &rarr; Stripe</strong> before this action can run. If keys are missing, a setup prompt will appear automatically.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Output</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Creates a one-time payment link. The URL is also available as <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">{"{{payment_link_url}}"}</code> for use in later steps.</p>
            </div>
          </>
        );

      /* ---- Integration: Google Calendar Event ---- */
      case "google_calendar_event":
        return (
          <>
            <div>
              <label className={labelClass}>Event Title</label>
              <input className={inputClass} value={(node.config.summary as string) ?? ""} onChange={(e) => update("summary", e.target.value)} onFocus={trackFocus("summary")} placeholder="Onboarding call with {{entity_name}}" />
            </div>
            <div>
              <label className={labelClass}>Description (optional)</label>
              <textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Follow-up call for new client onboarding" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start (days from now)</label>
                <input className={inputClass} type="number" min={0} value={(node.config.start_offset_days as number) ?? ""} onChange={(e) => update("start_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 1" />
                <p className="mt-1 text-xs text-gray-400">How many days from now the event starts.</p>
              </div>
              <div>
                <label className={labelClass}>Start Time</label>
                <input className={inputClass} type="time" value={(node.config.start_time as string) ?? "09:00"} onChange={(e) => update("start_time", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Duration (minutes)</label>
              <input className={inputClass} type="number" min={15} step={15} value={(node.config.duration_minutes as number) ?? ""} onChange={(e) => update("duration_minutes", e.target.value ? Number(e.target.value) : null)} placeholder="30" />
            </div>
            <div>
              <label className={labelClass}>Attendee Email (optional)</label>
              <input className={inputClass} value={(node.config.attendee_email as string) ?? ""} onChange={(e) => update("attendee_email", e.target.value)} placeholder="{{attendee_email}}" />
              <p className="mt-1 text-xs text-gray-400">Invite this email to the calendar event.</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Google Calendar Integration Required</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Configure your OAuth credentials in <strong>Settings &rarr; Integrations &rarr; Google Calendar</strong>.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      /* ---- Integration: Zapier Trigger ---- */
      case "zapier_trigger":
        return (
          <>
            <div>
              <label className={labelClass}>Webhook URL (optional override)</label>
              <input className={inputClass} value={(node.config.webhook_url as string) ?? ""} onChange={(e) => update("webhook_url", e.target.value)} placeholder="Leave blank to use integration default" />
              <p className="mt-1 text-xs text-gray-400">Override the Zapier webhook URL from your integration settings. Leave blank to use the default.</p>
            </div>
            <div>
              <label className={labelClass}>Custom Payload JSON (optional)</label>
              <textarea className={inputClass} rows={4} value={(node.config.payload_json as string) ?? ""} onChange={(e) => update("payload_json", e.target.value)} onFocus={trackFocus("payload_json")} placeholder={'{\n  "client_name": "{{entity_name}}",\n  "event": "{{entity_type}}"\n}'} />
              <p className="mt-1 text-xs text-gray-400">Custom JSON data to send to Zapier. If empty, the full trigger context (entity ID, type, name, etc.) is sent automatically.</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Zapier Integration Required</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Configure your Zapier Webhook URL in <strong>Settings &rarr; Integrations &rarr; Zapier</strong>. Create a &ldquo;Catch Hook&rdquo; trigger in Zapier to receive the data.
              </p>
            </div>
            <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{actionLabel(at)}</h4>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Action type selector */}
      <div>
        <label className={labelClass}>Action Type</label>
        <select
          className={inputClass}
          value={at}
          onChange={(e) => onChangeActionType(node.id, e.target.value)}
        >
          {actionCategories.map((cat) => (
            <optgroup key={cat.label} label={cat.label}>
              {cat.items.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {renderFields()}

      {/* Universal variable palette for action types that don't include one inline */}
      {!["send_sms", "send_slack", "send_whatsapp", "http_request", "log_activity", "elevenlabs_tts", "openai_generate", "google_calendar_event", "zapier_trigger"].includes(at) && (
        <VariablePalette triggerType={triggerType} nodes={nodes} connections={connections} currentNodeId={node.id} onInsert={handleInsertVariable} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const WorkflowEditor = ({ workflowId }: WorkflowEditorProps) => {
  const [meta, setMeta] = useState<WorkflowMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [activeProviders, setActiveProviders] = useState<Set<string>>(new Set());

  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef(pan);
  panRef.current = pan;

  /* ---------- Data fetching ---------- */

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workflows/${workflowId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const wf = json.workflow ?? json;
      setMeta({
        id: wf.id,
        name: wf.name ?? "",
        description: wf.description ?? "",
        status: wf.status ?? "draft",
        trigger_type: wf.trigger_type ?? "manual",
        trigger_config: wf.trigger_config ?? {},
      });
      const rawSteps = wf.steps ?? [];
      const { nodes: n, connections: c } = stepsToNodes(
        wf.trigger_type ?? "manual",
        wf.trigger_config ?? {},
        rawSteps,
        wf.graph_layout ?? null
      );
      setNodes(n);
      setConnections(c);
    } catch (err) {
      console.error("Error loading workflow:", err);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/runs?workflow_id=${workflowId}`);
      if (!res.ok) return;
      const json = await res.json();
      const runs = Array.isArray(json) ? json : json.runs ?? [];
      setRecentRuns(runs.slice(0, 5));
    } catch { /* ignore */ }
  }, [workflowId]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.events ?? [];
      setEvents(
        list.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          title: (e.title ?? e.name ?? "") as string,
          event_type: (e.event_type ?? null) as string | null,
          start_date: (e.start_date ?? null) as string | null,
          status: (e.status ?? null) as string | null,
        }))
      );
    } catch { /* ignore */ }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/integrations");
      if (!res.ok) return;
      const json = await res.json();
      const list = json.integrations ?? [];
      const active = new Set<string>();
      for (const i of list) {
        if (i.is_active && i.config && Object.keys(i.config).length > 0) {
          active.add(i.provider as string);
        }
      }
      setActiveProviders(active);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchWorkflow();
    fetchRuns();
    fetchEvents();
    fetchIntegrations();
  }, [fetchWorkflow, fetchRuns, fetchEvents, fetchIntegrations]);

  /** Action categories filtered to hide integrations without configured API keys */
  const filteredActionCategories = useMemo(() => {
    return ACTION_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const provider = ACTION_PROVIDER_MAP[item.value];
        // Not an integration action — always show
        if (!provider) return true;
        // Only show if the provider is active
        return activeProviders.has(provider);
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [activeProviders]);

  /* ---------- Save ---------- */

  const handleSave = async () => {
    if (!meta) return;
    const triggerNode = nodes.find((n) => n.type === "trigger");
    const steps = nodesToSteps(triggerNode?.id ?? "trigger", nodes, connections);

    // Persist visual graph layout so connections + positions survive reload
    const graph_layout = {
      positions: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
      connections: connections.map((c) => ({ id: c.id, from: c.from, to: c.to })),
      nodeIdMap: nodes
        .filter((n) => n.type === "action")
        .map((n, i) => ({ nodeId: n.id, stepIndex: i })),
    };

    try {
      setSaving(true);
      setSaveMessage("");
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meta.name,
          description: meta.description,
          trigger_type: meta.trigger_type,
          trigger_config: meta.trigger_config,
          updated_at: new Date().toISOString(),
          steps,
          graph_layout,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      setIsDirty(false);
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (err) {
      console.error("Error saving:", err);
      setSaveMessage("Failed to save");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!meta) return;
    const newStatus = meta.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      setMeta((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleRunNow = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_data: {} }),
      });
      if (!res.ok) throw new Error("Execute failed");
      fetchRuns();
    } catch (err) {
      console.error("Error executing:", err);
    }
  };

  /* ---------- Node operations ---------- */

  const markDirty = () => setIsDirty(true);

  const addActionNode = (actionType: string) => {
    const maxY = nodes.reduce((max, n) => Math.max(max, n.y), 0);
    const centerX = nodes.length > 0 ? nodes[0].x : 300;
    const newNode: NodeData = {
      id: uid(),
      type: "action",
      action_type: actionType,
      config: {},
      x: centerX,
      y: maxY + 130,
    };
    setNodes((prev) => [...prev, newNode]);

    const lastInChain = findLastInChain();
    if (lastInChain) {
      setConnections((prev) => [
        ...prev,
        { id: uid(), from: lastInChain, to: newNode.id },
      ]);
    }
    setSelectedNode(newNode.id);
    setShowAddMenu(false);
    markDirty();
  };

  const findLastInChain = (): string | null => {
    const hasOutgoing = new Set(connections.map((c) => c.from));
    const candidates = nodes.filter((n) => !hasOutgoing.has(n.id));
    if (candidates.length === 0) return nodes.length > 0 ? nodes[nodes.length - 1].id : null;
    candidates.sort((a, b) => b.y - a.y);
    return candidates[0].id;
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === "trigger") return;
    const incoming = connections.filter((c) => c.to === nodeId);
    const outgoing = connections.filter((c) => c.from === nodeId);
    const newConns: Connection[] = [];
    for (const inc of incoming) {
      for (const out of outgoing) {
        newConns.push({ id: uid(), from: inc.from, to: out.to });
      }
    }
    setConnections((prev) => [
      ...prev.filter((c) => c.from !== nodeId && c.to !== nodeId),
      ...newConns,
    ]);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
    markDirty();
  };

  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, config } : n)));
    markDirty();
  };

  const changeNodeActionType = (nodeId: string, actionType: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, action_type: actionType, config: {} } : n
      )
    );
    markDirty();
  };

  /* ---------- Mouse handlers ---------- */

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: clientX - rect.left - panRef.current.x,
      y: clientY - rect.top - panRef.current.y,
    };
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNode(nodeId);
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
    setSelectedNode(nodeId);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingNode) {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNode
              ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y }
              : n
          )
        );
        markDirty();
      } else if (connectingFrom) {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        setMousePos(pt);
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [draggingNode, dragOffset, connectingFrom, isPanning, panStart, getCanvasPoint]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingNode) setDraggingNode(null);
    if (connectingFrom) setConnectingFrom(null);
    if (isPanning) setIsPanning(false);
  }, [draggingNode, connectingFrom, isPanning]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setSelectedNode(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  /* ---------- Port / connection handlers ---------- */

  const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
    const pt = getCanvasPoint(e.clientX, e.clientY);
    setMousePos(pt);
  };

  const handleInputPortMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId) {
      const exists = connections.some(
        (c) => c.from === connectingFrom && c.to === nodeId
      );
      if (!exists) {
        // Remove any existing incoming connection to this node (single input)
        setConnections((prev) => [
          ...prev.filter((c) => c.to !== nodeId),
          { id: uid(), from: connectingFrom, to: nodeId },
        ]);
        markDirty();
      }
    }
    setConnectingFrom(null);
  };

  const deleteConnection = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    markDirty();
  };

  /* ---------- Canvas dimensions ---------- */

  const canvasSize = useMemo(() => {
    let maxX = 900;
    let maxY = 600;
    for (const n of nodes) {
      maxX = Math.max(maxX, n.x + NODE_W + 100);
      maxY = Math.max(maxY, n.y + NODE_H + 100);
    }
    return { width: maxX, height: maxY };
  }, [nodes]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode) ?? null;

  /* ---------- Validation ---------- */

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const connectedNodes = new Set<string>();
    for (const c of connections) {
      connectedNodes.add(c.from);
      connectedNodes.add(c.to);
    }
    const disconnected = nodes.filter((n) => n.type === "action" && !connectedNodes.has(n.id));
    if (disconnected.length > 0) {
      warnings.push(`${disconnected.length} disconnected node(s)`);
    }
    const actionNodes = nodes.filter((n) => n.type === "action");
    if (actionNodes.length === 0) {
      warnings.push("No action nodes added");
    }
    return warnings;
  }, [nodes, connections]);

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">Workflow not found.</p>
        <Link href="/dashboard/automation/workflows" className="text-sm font-medium text-brand-500 hover:underline">
          Back to workflows
        </Link>
      </div>
    );
  }

  return (
    <FeatureGate feature="workflows">
      <div className="flex flex-col gap-4">
        {/* Header bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/automation/workflows"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <input
              className="min-w-0 flex-1 border-none bg-transparent text-lg font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-white"
              value={meta.name}
              onChange={(e) => { setMeta((p) => p ? { ...p, name: e.target.value } : p); markDirty(); }}
              placeholder="Workflow name"
            />

            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[meta.status] || STATUS_STYLES.draft}`}>
              {meta.status}
            </span>

            <div className="flex items-center gap-2">
              {validationWarnings.length > 0 && (
                <span className="text-xs font-medium text-amber-500" title={validationWarnings.join(", ")}>
                  {validationWarnings.length} warning{validationWarnings.length > 1 ? "s" : ""}
                </span>
              )}
              {saveMessage && (
                <span className={`text-xs font-medium ${saveMessage === "Saved!" ? "text-green-600" : "text-red-500"}`}>
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</> : "Save"}
              </button>
              <button
                onClick={handleToggleStatus}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  meta.status === "active"
                    ? "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                    : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                }`}
              >
                {meta.status === "active" ? "Pause" : "Activate"}
              </button>
              <button
                onClick={handleRunNow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Run
              </button>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex gap-4" style={{ minHeight: "calc(100vh - 220px)" }}>
          {/* Canvas area */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Action palette */}
            <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Add:</span>
                {/* Grouped add buttons */}
                {filteredActionCategories.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600">{cat.label}</span>
                    {cat.items.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => addActionNode(a.value)}
                        title={a.label}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-brand-500"
                      >
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-white ${a.color}`}>
                          <ActionIcon type={a.value} size={10} />
                        </span>
                        <span className="hidden xl:inline">{a.label}</span>
                      </button>
                    ))}
                    <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div
              className="relative flex-1 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              style={{ minHeight: 500 }}
            >
              <div
                ref={canvasRef}
                className="relative select-none"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  cursor: isPanning ? "grabbing" : connectingFrom ? "crosshair" : "default",
                  backgroundImage: "radial-gradient(circle, rgb(209 213 219 / 0.5) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* SVG layer */}
                <svg
                  className="pointer-events-none absolute inset-0"
                  width={canvasSize.width}
                  height={canvasSize.height}
                  style={{ overflow: "visible" }}
                >
                  {connections.map((conn) => {
                    const fromNode = nodes.find((n) => n.id === conn.from);
                    const toNode = nodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <g key={conn.id} className="pointer-events-auto">
                        <path
                          d={connectionPath(fromNode, toNode)}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={16}
                          className="cursor-pointer"
                          onClick={() => deleteConnection(conn.id)}
                        />
                        <path
                          d={connectionPath(fromNode, toNode)}
                          fill="none"
                          stroke="url(#wire-gradient)"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          className="pointer-events-none"
                        />
                        <circle r={3} fill="#6366f1">
                          <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={connectionPath(fromNode, toNode)}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {connectingFrom && (() => {
                    const fromNode = nodes.find((n) => n.id === connectingFrom);
                    if (!fromNode) return null;
                    const x1 = fromNode.x + NODE_W / 2;
                    const y1 = fromNode.y + NODE_H;
                    const x2 = mousePos.x;
                    const y2 = mousePos.y;
                    const cy = Math.max(Math.abs(y2 - y1) * 0.4, 30);
                    return (
                      <path
                        d={`M ${x1} ${y1} C ${x1} ${y1 + cy}, ${x2} ${y2 - cy}, ${x2} ${y2}`}
                        fill="none"
                        stroke="#a5b4fc"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                      />
                    );
                  })()}

                  <defs>
                    <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedNode === node.id;
                  const isTrigger = node.type === "trigger";
                  const nodeColor = isTrigger ? "bg-indigo-500" : actionColor(node.action_type || "");
                  const isDisconnected = node.type === "action" && !connections.some((c) => c.from === node.id || c.to === node.id);

                  return (
                    <div
                      key={node.id}
                      className={`absolute flex flex-col rounded-xl border-2 shadow-lg transition-shadow ${
                        isSelected
                          ? "border-brand-500 shadow-brand-500/20 ring-2 ring-brand-500/20"
                          : isDisconnected
                          ? "border-red-300 dark:border-red-700"
                          : isTrigger
                          ? "border-indigo-300 dark:border-indigo-700"
                          : "border-gray-200 dark:border-gray-600"
                      } ${isTrigger ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-white dark:bg-gray-800"}`}
                      style={{
                        left: node.x,
                        top: node.y,
                        width: NODE_W,
                        height: NODE_H,
                        cursor: draggingNode === node.id ? "grabbing" : "grab",
                        zIndex: draggingNode === node.id ? 50 : isSelected ? 40 : 10,
                      }}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    >
                      {/* Input port */}
                      {!isTrigger && (
                        <div
                          className="absolute -top-2 left-1/2 z-20 -translate-x-1/2"
                          onMouseUp={(e) => handleInputPortMouseUp(e, node.id)}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                              connectingFrom
                                ? "scale-150 border-brand-500 bg-brand-100 dark:bg-brand-900"
                                : "border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-700"
                            }`}
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex flex-1 items-center gap-3 px-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${nodeColor}`}>
                          {isTrigger ? (
                            <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ) : (
                            <ActionIcon type={node.action_type || ""} size={18} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {isTrigger ? "Trigger" : actionLabel(node.action_type || "")}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {isTrigger
                              ? triggerLabel(meta.trigger_type)
                              : (node.config.title as string) ||
                                (node.config.name as string) ||
                                (node.config.subject as string) ||
                                (node.config.tag ? `Tag: ${node.config.tag}` : "") ||
                                (node.config.new_status ? `-> ${node.config.new_status}` : "") ||
                                (node.config.url ? `${(node.config.method as string) || "POST"} ${(node.config.url as string).slice(0, 25)}` : "") ||
                                (node.config.condition_field ? `if ${node.config.condition_field} ${node.config.condition_operator || "equals"} ...` : "") ||
                                (node.config.duration ? `Wait ${node.config.duration} ${node.config.unit || "hours"}` : "") ||
                                (node.config.instructions ? "Approval required" : "") ||
                                (node.config.assignee_id ? "Assign user" : "") ||
                                (node.config.field_name ? `Set ${node.config.field_name}` : "") ||
                                "Click to configure"}
                          </p>
                        </div>
                        {isDisconnected && (
                          <span className="shrink-0 text-red-400" title="Disconnected node">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Output port */}
                      <div
                        className="absolute -bottom-2 left-1/2 z-20 -translate-x-1/2 cursor-crosshair"
                        onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-500 dark:bg-gray-700 dark:hover:border-brand-400">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* "Add node" floating button below last node */}
                {nodes.length > 0 && !draggingNode && !connectingFrom && (() => {
                  const last = findLastInChain();
                  const lastNode = nodes.find((n) => n.id === last);
                  if (!lastNode) return null;
                  return (
                    <div
                      className="absolute"
                      style={{
                        left: lastNode.x + NODE_W / 2 - 16,
                        top: lastNode.y + NODE_H + 24,
                        zIndex: 5,
                      }}
                    >
                      <div className="relative">
                        <button
                          onClick={() => setShowAddMenu((p) => !p)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white text-gray-400 transition-all hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-brand-500"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                          </svg>
                        </button>
                        {showAddMenu && (
                          <div className="absolute left-1/2 top-10 z-50 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-600 dark:bg-gray-800" style={{ width: 220 }}>
                            {filteredActionCategories.map((cat) => (
                              <div key={cat.label}>
                                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{cat.label}</p>
                                {cat.items.map((a) => (
                                  <button
                                    key={a.value}
                                    onClick={() => addActionNode(a.value)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-white ${a.color}`}>
                                      <ActionIcon type={a.value} size={12} />
                                    </span>
                                    {a.label}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden w-80 shrink-0 flex-col gap-4 lg:flex">
            {/* Config panel */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              {selectedNodeData ? (
                <NodeConfigPanel
                  node={selectedNodeData}
                  triggerType={meta.trigger_type}
                  triggerConfig={meta.trigger_config}
                  events={events}
                  nodes={nodes}
                  connections={connections}
                  actionCategories={filteredActionCategories}
                  onUpdateConfig={(config) => updateNodeConfig(selectedNodeData.id, config)}
                  onUpdateTrigger={(type, config) => {
                    setMeta((p) => p ? { ...p, trigger_type: type, trigger_config: config } : p);
                    markDirty();
                  }}
                  onChangeActionType={changeNodeActionType}
                  onDelete={() => deleteNode(selectedNodeData.id)}
                  onClose={() => setSelectedNode(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a node</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Click any node to configure it.
                    <br />Drag from output ports to connect.
                    <br />Click a wire to delete it.
                  </p>
                </div>
              )}
            </div>

            {/* Recent runs */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent Runs</h3>
              {recentRuns.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No runs yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5 dark:border-gray-700">
                      <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                        {new Date(run.started_at).toLocaleString()}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${RUN_STATUS_STYLES[run.status] ?? RUN_STATUS_STYLES.cancelled}`}>
                        {run.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Help</h3>
              <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex gap-2"><span className="font-semibold text-gray-600 dark:text-gray-300">Drag</span> nodes to reposition</li>
                <li className="flex gap-2"><span className="font-semibold text-gray-600 dark:text-gray-300">Port</span> drag from output to input to connect</li>
                <li className="flex gap-2"><span className="font-semibold text-gray-600 dark:text-gray-300">Click wire</span> to remove a connection</li>
                <li className="flex gap-2"><span className="font-semibold text-gray-600 dark:text-gray-300">{"{{var}}"}</span> use template variables in text fields</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};
