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
  { value: "project_created", label: "Project Created" },
  { value: "task_status_changed", label: "Task Status Changed" },
  { value: "event_created", label: "Event Created" },
  { value: "invoice_overdue", label: "Invoice Overdue" },
];

const ACTION_CATEGORIES = [
  {
    label: "Create",
    items: [
      { value: "create_task", label: "Create Task", icon: "clipboard", color: "bg-blue-500" },
      { value: "create_project", label: "Create Project", icon: "folder", color: "bg-cyan-500" },
      { value: "create_event", label: "Create Event", icon: "calendar", color: "bg-teal-500" },
    ],
  },
  {
    label: "Notify",
    items: [
      { value: "send_notification", label: "Send Notification", icon: "bell", color: "bg-purple-500" },
      { value: "send_email", label: "Send Email", icon: "mail", color: "bg-red-500" },
    ],
  },
  {
    label: "Update",
    items: [
      { value: "update_status", label: "Update Status", icon: "refresh", color: "bg-green-500" },
      { value: "update_field", label: "Update Field", icon: "edit", color: "bg-emerald-500" },
      { value: "assign_to", label: "Assign To", icon: "user", color: "bg-sky-500" },
      { value: "add_tag", label: "Add Tag", icon: "tag", color: "bg-pink-500" },
    ],
  },
  {
    label: "Control",
    items: [
      { value: "condition", label: "Condition", icon: "branch", color: "bg-orange-500" },
      { value: "approval", label: "Approval Gate", icon: "check", color: "bg-amber-500" },
      { value: "wait_delay", label: "Wait / Delay", icon: "clock", color: "bg-gray-500" },
      { value: "webhook", label: "Webhook", icon: "globe", color: "bg-violet-500" },
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

const NODE_W = 240;
const NODE_H = 76;

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
  steps: { id?: string; step_order: number; step_type: string; config: Record<string, unknown> }[]
): { nodes: NodeData[]; connections: Connection[] } {
  const CANVAS_CENTER_X = 400;
  const START_Y = 60;
  const GAP_Y = 130;

  const triggerNode: NodeData = {
    id: "trigger",
    type: "trigger",
    config: triggerConfig ?? {},
    x: CANVAS_CENTER_X - NODE_W / 2,
    y: START_Y,
  };

  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);
  const actionNodes: NodeData[] = sorted.map((s, i) => ({
    id: s.id || uid(),
    type: "action" as const,
    action_type: s.step_type,
    config: s.config ?? {},
    x: CANVAS_CENTER_X - NODE_W / 2,
    y: START_Y + (i + 1) * GAP_Y,
  }));

  const allNodes = [triggerNode, ...actionNodes];
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
    default: return <svg {...p}><circle cx="12" cy="12" r="3" /></svg>;
  }
}

/* ------------------------------------------------------------------ */
/*  Node config panel                                                  */
/* ------------------------------------------------------------------ */

function NodeConfigPanel({
  node,
  triggerType,
  triggerConfig,
  onUpdateConfig,
  onUpdateTrigger,
  onChangeActionType,
  onDelete,
  onClose,
}: {
  node: NodeData;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Use <code className="rounded bg-blue-100 px-1 dark:bg-blue-800">{"{{entity_id}}"}</code> in action configs to reference the entity that triggered this workflow.
          </p>
        </div>
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
            <div><label className={labelClass}>Task Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Welcome Call" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Task description (supports {{entity_id}})" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Priority</label><select className={inputClass} value={(node.config.priority as string) || "medium"} onChange={(e) => update("priority", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              <div><label className={labelClass}>Due (days)</label><input className={inputClass} type="number" min={0} value={(node.config.due_date_offset_days as number) ?? ""} onChange={(e) => update("due_date_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 3" /></div>
            </div>
          </>
        );
      case "create_project":
        return (
          <>
            <div><label className={labelClass}>Project Name</label><input className={inputClass} value={(node.config.name as string) ?? ""} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Client Onboarding" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Project description" /></div>
            <div><label className={labelClass}>Initial Status</label><select className={inputClass} value={(node.config.status as string) || "planning"} onChange={(e) => update("status", e.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On Hold</option></select></div>
          </>
        );
      case "create_event":
        return (
          <>
            <div><label className={labelClass}>Event Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Kickoff Meeting" /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={(node.config.description as string) ?? ""} onChange={(e) => update("description", e.target.value)} placeholder="Event description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Type</label><select className={inputClass} value={(node.config.event_type as string) || "general"} onChange={(e) => update("event_type", e.target.value)}><option value="general">General</option><option value="meeting">Meeting</option><option value="conference">Conference</option><option value="workshop">Workshop</option></select></div>
              <div><label className={labelClass}>Start (days)</label><input className={inputClass} type="number" min={0} value={(node.config.start_date_offset_days as number) ?? ""} onChange={(e) => update("start_date_offset_days", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 7" /></div>
            </div>
          </>
        );
      case "send_notification":
        return (
          <>
            <div><label className={labelClass}>Title</label><input className={inputClass} value={(node.config.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Notification title" /></div>
            <div><label className={labelClass}>Message</label><textarea className={inputClass} rows={3} value={(node.config.message as string) ?? ""} onChange={(e) => update("message", e.target.value)} placeholder="Notification message (supports {{entity_id}})" /></div>
            <div><label className={labelClass}>Action URL (optional)</label><input className={inputClass} value={(node.config.action_url as string) ?? ""} onChange={(e) => update("action_url", e.target.value)} placeholder="/dashboard/..." /></div>
          </>
        );
      case "send_email":
        return (
          <>
            <div><label className={labelClass}>Subject</label><input className={inputClass} value={(node.config.subject as string) ?? ""} onChange={(e) => update("subject", e.target.value)} placeholder="Email subject" /></div>
            <div><label className={labelClass}>Body</label><textarea className={inputClass} rows={3} value={(node.config.body as string) ?? ""} onChange={(e) => update("body", e.target.value)} placeholder="Email body" /></div>
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
          {ACTION_CATEGORIES.map((cat) => (
            <optgroup key={cat.label} label={cat.label}>
              {cat.items.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {renderFields()}
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
        rawSteps
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

  useEffect(() => {
    fetchWorkflow();
    fetchRuns();
  }, [fetchWorkflow, fetchRuns]);

  /* ---------- Save ---------- */

  const handleSave = async () => {
    if (!meta) return;
    const triggerNode = nodes.find((n) => n.type === "trigger");
    const steps = nodesToSteps(triggerNode?.id ?? "trigger", nodes, connections);
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
                {ACTION_CATEGORIES.map((cat) => (
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
                            {ACTION_CATEGORIES.map((cat) => (
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
