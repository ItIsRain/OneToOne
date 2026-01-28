import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Execute a workflow by running its steps in order.
 * Supports: create_task, create_project, create_event, send_notification,
 * update_status, update_field, assign_to, add_tag, approval, wait_delay,
 * send_email, condition, webhook
 */
export async function executeWorkflow(
  workflowId: string,
  triggerData: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<string> {
  // Create workflow run record
  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflowId,
      tenant_id: tenantId,
      status: "running",
      trigger_data: triggerData,
      triggered_by: userId,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(`Failed to create workflow run: ${runError?.message}`);
  }

  const runId = run.id;

  // Fetch workflow steps ordered by step_order
  const { data: steps, error: stepsError } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("step_order", { ascending: true });

  if (stepsError || !steps || steps.length === 0) {
    await markRunStatus(supabase, runId, steps ? "completed" : "failed");
    return runId;
  }

  // Context accumulates outputs from previous steps so later steps can reference them
  const context: Record<string, unknown> = { ...triggerData };

  for (const step of steps) {
    const config = step.config as Record<string, unknown>;

    // Create step execution record
    const { data: stepExec, error: stepExecError } = await supabase
      .from("workflow_step_executions")
      .insert({
        run_id: runId,
        step_id: step.id,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (stepExecError || !stepExec) {
      await markRunStatus(supabase, runId, "failed");
      return runId;
    }

    try {
      const output = await executeStep(
        step.step_type,
        config,
        context,
        supabase,
        userId,
        tenantId,
        runId,
        step.id,
        stepExec.id
      );

      // If the step paused execution (approval / wait_delay), stop here
      if (output?.__paused) {
        return runId;
      }

      // Merge output into context for subsequent steps
      if (output) {
        Object.assign(context, output);
      }

      // Mark step completed
      await supabase
        .from("workflow_step_executions")
        .update({
          status: "completed",
          output: output ?? {},
          completed_at: new Date().toISOString(),
        })
        .eq("id", stepExec.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await supabase
        .from("workflow_step_executions")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", stepExec.id);

      await markRunStatus(supabase, runId, "failed");
      return runId;
    }
  }

  await markRunStatus(supabase, runId, "completed");
  return runId;
}

/* ------------------------------------------------------------------ */
/*  Step executor                                                      */
/* ------------------------------------------------------------------ */

async function executeStep(
  stepType: string,
  config: Record<string, unknown>,
  context: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
  runId: string,
  stepId: string,
  stepExecId: string
): Promise<Record<string, unknown> | null> {
  // Resolve template variables in string config values: {{entity_id}}, {{entity_type}}, etc.
  const resolved = resolveTemplates(config, context);

  switch (stepType) {
    /* ---- Create Task ---- */
    case "create_task": {
      const dueDate = new Date();
      if (resolved.due_date_offset_days) {
        dueDate.setDate(dueDate.getDate() + Number(resolved.due_date_offset_days));
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: resolved.title || "Untitled Task",
          description: resolved.description,
          assigned_to: resolved.assigned_to || null,
          project_id: resolved.project_id || (context.entity_type === "project" ? context.entity_id : null),
          priority: resolved.priority || "medium",
          due_date: dueDate.toISOString(),
          tenant_id: tenantId,
          created_by: userId,
          status: "todo",
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create task: ${error.message}`);
      return { created_task_id: task?.id };
    }

    /* ---- Create Project ---- */
    case "create_project": {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: resolved.name || "Untitled Project",
          description: resolved.description,
          status: resolved.status || "planning",
          client_id: resolved.client_id || (context.entity_type === "client" ? context.entity_id : null),
          project_manager_id: resolved.project_manager_id || null,
          tenant_id: tenantId,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create project: ${error.message}`);
      return { created_project_id: project?.id };
    }

    /* ---- Create Event ---- */
    case "create_event": {
      const startDate = new Date();
      if (resolved.start_date_offset_days) {
        startDate.setDate(startDate.getDate() + Number(resolved.start_date_offset_days));
      }

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          title: resolved.title || "Untitled Event",
          description: resolved.description,
          start_date: startDate.toISOString(),
          status: "upcoming",
          event_type: resolved.event_type || "general",
          category: resolved.category || "General",
          client_id: resolved.client_id || (context.entity_type === "client" ? context.entity_id : null),
          assigned_to: resolved.assigned_to || null,
          tenant_id: tenantId,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create event: ${error.message}`);
      return { created_event_id: event?.id };
    }

    /* ---- Send Notification ---- */
    case "send_notification": {
      const recipientId = resolved.recipient_id || userId;
      const { error } = await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "workflow",
        title: resolved.title || "Workflow Notification",
        message: resolved.message || "",
        tenant_id: tenantId,
        action_url: resolved.action_url || null,
      });

      if (error) throw new Error(`Failed to send notification: ${error.message}`);
      return { notification_sent: true };
    }

    /* ---- Update Status ---- */
    case "update_status": {
      const entityId = (resolved.entity_id as string) || (context.entity_id as string);
      const entityType = (resolved.entity_type as string) || (context.entity_type as string);
      const newStatus = resolved.new_status as string;

      if (!entityId || !entityType || !newStatus) {
        throw new Error("Missing entity_id, entity_type, or new_status for update_status");
      }

      const tableName = entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq("id", entityId);

      if (error) throw new Error(`Failed to update status: ${error.message}`);
      return { status_updated: true, entity_id: entityId, new_status: newStatus };
    }

    /* ---- Update Field ---- */
    case "update_field": {
      const entityId = (resolved.entity_id as string) || (context.entity_id as string);
      const entityType = (resolved.entity_type as string) || (context.entity_type as string);
      const fieldName = resolved.field_name as string;
      const fieldValue = resolved.field_value;

      if (!entityId || !entityType || !fieldName) {
        throw new Error("Missing entity_id, entity_type, or field_name for update_field");
      }

      const tableName = entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

      const { error } = await supabase
        .from(tableName)
        .update({ [fieldName]: fieldValue })
        .eq("id", entityId);

      if (error) throw new Error(`Failed to update field: ${error.message}`);
      return { field_updated: true, field_name: fieldName };
    }

    /* ---- Assign To ---- */
    case "assign_to": {
      const entityId = (resolved.entity_id as string) || (context.entity_id as string);
      const entityType = (resolved.entity_type as string) || (context.entity_type as string);
      const assigneeId = resolved.assignee_id as string;

      if (!entityId || !entityType || !assigneeId) {
        throw new Error("Missing entity_id, entity_type, or assignee_id for assign_to");
      }

      const tableName = entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";
      const assignField = entityType === "project" ? "project_manager_id" : "assigned_to";

      const { error } = await supabase
        .from(tableName)
        .update({ [assignField]: assigneeId })
        .eq("id", entityId);

      if (error) throw new Error(`Failed to assign: ${error.message}`);

      // Also send a notification to the assignee
      await supabase.from("notifications").insert({
        user_id: assigneeId,
        type: "workflow",
        title: "You've been assigned",
        message: resolved.message || `You have been assigned to a ${entityType}.`,
        tenant_id: tenantId,
      }).then(() => {});

      return { assigned: true, assignee_id: assigneeId };
    }

    /* ---- Add Tag ---- */
    case "add_tag": {
      const entityId = (resolved.entity_id as string) || (context.entity_id as string);
      const entityType = (resolved.entity_type as string) || (context.entity_type as string);
      const tag = resolved.tag as string;

      if (!entityId || !entityType || !tag) {
        throw new Error("Missing entity_id, entity_type, or tag for add_tag");
      }

      const tableName = entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

      // Fetch current tags
      const { data: entity } = await supabase
        .from(tableName)
        .select("tags")
        .eq("id", entityId)
        .single();

      const currentTags = Array.isArray(entity?.tags) ? entity.tags : [];
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        const { error } = await supabase
          .from(tableName)
          .update({ tags: currentTags })
          .eq("id", entityId);

        if (error) throw new Error(`Failed to add tag: ${error.message}`);
      }

      return { tag_added: tag };
    }

    /* ---- Approval Gate ---- */
    case "approval": {
      const { error: approvalError } = await supabase
        .from("workflow_approvals")
        .insert({
          step_execution_id: stepExecId,
          requested_from: resolved.approver_id || userId,
          tenant_id: tenantId,
          status: "pending",
        });

      if (approvalError) throw new Error(`Failed to create approval: ${approvalError.message}`);

      // Notify the approver
      await supabase.from("notifications").insert({
        user_id: resolved.approver_id || userId,
        type: "approval",
        title: "Approval Required",
        message: (resolved.instructions as string) || "A workflow step requires your approval.",
        tenant_id: tenantId,
        action_url: "/dashboard/automation/approvals",
      }).then(() => {});

      await supabase.from("workflow_step_executions").update({ status: "waiting_approval" }).eq("id", stepExecId);
      await supabase.from("workflow_runs").update({ status: "waiting_approval" }).eq("id", runId);

      return { __paused: true };
    }

    /* ---- Wait / Delay ---- */
    case "wait_delay": {
      await supabase.from("workflow_step_executions").update({ status: "waiting_approval" }).eq("id", stepExecId);
      await supabase.from("workflow_runs").update({ status: "waiting_approval" }).eq("id", runId);
      return { __paused: true };
    }

    /* ---- Send Email ---- */
    case "send_email": {
      // Creates a notification as email placeholder
      const recipientId = resolved.recipient_id || userId;
      const { error } = await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "workflow",
        title: resolved.subject || resolved.title || "Workflow Email",
        message: resolved.body || resolved.message || "",
        tenant_id: tenantId,
      });

      if (error) throw new Error(`Failed to send email notification: ${error.message}`);
      return { email_sent: true };
    }

    /* ---- Condition (if/else - simplified) ---- */
    case "condition": {
      // Evaluate a simple condition against context
      const field = resolved.condition_field as string;
      const operator = resolved.condition_operator as string;
      const value = resolved.condition_value;

      if (!field || !operator) {
        throw new Error("Missing condition_field or condition_operator");
      }

      const actualValue = context[field];
      let result = false;

      switch (operator) {
        case "equals":
          result = actualValue === value;
          break;
        case "not_equals":
          result = actualValue !== value;
          break;
        case "contains":
          result = String(actualValue ?? "").includes(String(value));
          break;
        case "not_empty":
          result = actualValue !== null && actualValue !== undefined && actualValue !== "";
          break;
        case "is_empty":
          result = actualValue === null || actualValue === undefined || actualValue === "";
          break;
        default:
          result = false;
      }

      // If condition fails, we skip remaining steps (simplified branching)
      if (!result && resolved.skip_on_fail !== false) {
        // Mark run as completed (condition not met, nothing more to do)
        await supabase.from("workflow_step_executions").update({
          status: "skipped",
          output: { condition_result: false, reason: `${field} ${operator} ${value}: not met` },
          completed_at: new Date().toISOString(),
        }).eq("id", stepExecId);

        await markRunStatus(supabase, runId, "completed");
        return { __paused: true }; // Stop execution
      }

      return { condition_result: result };
    }

    /* ---- Webhook ---- */
    case "webhook": {
      const url = resolved.url as string;
      if (!url) throw new Error("Missing webhook URL");

      const method = (resolved.method as string)?.toUpperCase() || "POST";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (resolved.auth_header) {
        headers["Authorization"] = resolved.auth_header as string;
      }

      const payload = {
        workflow_id: context.workflow_id,
        run_id: runId,
        trigger_data: context,
        custom_data: resolved.payload || {},
      };

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: method !== "GET" ? JSON.stringify(payload) : undefined,
        });

        return {
          webhook_status: response.status,
          webhook_ok: response.ok,
        };
      } catch (err) {
        throw new Error(`Webhook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      throw new Error(`Unknown step type: ${stepType}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function markRunStatus(supabase: SupabaseClient, runId: string, status: string) {
  await supabase
    .from("workflow_runs")
    .update({ status, completed_at: new Date().toISOString() })
    .eq("id", runId);
}

/** Replace {{variable}} placeholders in config string values with context values */
function resolveTemplates(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        const contextVal = context[varName];
        return contextVal !== undefined && contextVal !== null ? String(contextVal) : "";
      });
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}
