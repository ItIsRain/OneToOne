import { SupabaseClient, createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import {
  welcomeEmail,
  teamInviteEmail,
  eventRegistrationEmail,
  invoiceEmail,
  documentSharedEmail,
} from "@/lib/email-templates";

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
      const recipientId = await resolveRecipientId(
        resolved, context, supabase, userId, tenantId
      );
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

      const tableName = entityType === "client" ? "clients" : entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

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

      const tableName = entityType === "client" ? "clients" : entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

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

      const tableName = entityType === "client" ? "clients" : entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";
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

      const tableName = entityType === "client" ? "clients" : entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

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
      // Resolve who needs to approve based on approver_type config
      const approverType = (resolved.approver_type as string) || "trigger_user";
      let approverId: string;
      if (approverType === "specific_id" && resolved.approver_id) {
        approverId = resolved.approver_id as string;
      } else {
        approverId = userId; // trigger_user (default)
      }

      const { error: approvalError } = await supabase
        .from("workflow_approvals")
        .insert({
          step_execution_id: stepExecId,
          requested_from: approverId,
          tenant_id: tenantId,
          status: "pending",
        });

      if (approvalError) throw new Error(`Failed to create approval: ${approvalError.message}`);

      // Notify the approver
      await supabase.from("notifications").insert({
        user_id: approverId,
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
      const duration = Number(resolved.duration) || 1;
      const unit = (resolved.unit as string) || "hours";

      const resumeAt = new Date();
      switch (unit) {
        case "minutes":
          resumeAt.setMinutes(resumeAt.getMinutes() + duration);
          break;
        case "hours":
          resumeAt.setHours(resumeAt.getHours() + duration);
          break;
        case "days":
          resumeAt.setDate(resumeAt.getDate() + duration);
          break;
        default:
          resumeAt.setHours(resumeAt.getHours() + duration);
      }

      await supabase
        .from("workflow_step_executions")
        .update({
          status: "waiting_delay",
          output: { resume_at: resumeAt.toISOString(), duration, unit },
        })
        .eq("id", stepExecId);

      await supabase
        .from("workflow_runs")
        .update({ status: "waiting_delay" })
        .eq("id", runId);

      return { __paused: true, resume_at: resumeAt.toISOString() };
    }

    /* ---- Send Email ---- */
    case "send_email": {
      // Resolve recipient email based on recipient_type config
      const { email: recipientEmail, name: recipientName } = await resolveRecipientEmail(
        resolved, context, supabase, userId, tenantId
      );

      if (!recipientEmail) {
        throw new Error("Could not determine recipient email address");
      }
      const subject = (resolved.subject as string) || (resolved.title as string) || "Workflow Email";
      const template = (resolved.email_template as string) || "custom";

      let html: string;

      switch (template) {
        case "welcome":
          html = welcomeEmail(recipientName);
          break;
        case "team_invite":
          html = teamInviteEmail({
            inviterName: (resolved.inviter_name as string) || "Your team",
            teamName: (resolved.team_name as string) || "the team",
            role: (resolved.role as string) || "member",
            inviteUrl: (resolved.invite_url as string) || "",
          });
          break;
        case "event_registration":
          html = eventRegistrationEmail({
            attendeeName: recipientName,
            eventName: (resolved.event_name as string) || "Event",
            eventDate: (resolved.event_date as string) || "",
            eventTime: (resolved.event_time as string) || "",
            eventLocation: (resolved.event_location as string) || "",
            eventUrl: (resolved.event_url as string) || "",
          });
          break;
        case "invoice":
          html = invoiceEmail({
            clientName: recipientName,
            invoiceNumber: (resolved.invoice_number as string) || "",
            amount: (resolved.amount as string) || "",
            dueDate: (resolved.due_date as string) || "",
            viewUrl: (resolved.view_url as string) || "",
          });
          break;
        case "document_shared":
          html = documentSharedEmail({
            recipientName,
            senderName: (resolved.sender_name as string) || "Someone",
            documentName: (resolved.document_name as string) || "a document",
            message: resolved.message as string | undefined,
            viewUrl: (resolved.view_url as string) || "",
          });
          break;
        case "custom":
        default: {
          const body = (resolved.body as string) || (resolved.message as string) || "";
          html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
          <tr><td style="height:4px;background:#72b81a;border-radius:12px 12px 0 0;"></td></tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">${subject}</h1>
              <p style="margin:0;font-size:15px;color:#4b5563;line-height:26px;">${body}</p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} 1i1. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
          break;
        }
      }

      // Send the actual email
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        tenantId,
      });

      if (!emailSent) {
        throw new Error(`Failed to send email to ${recipientEmail}`);
      }

      // Also create a notification record as audit trail
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "workflow",
        title: `Email sent: ${subject}`,
        message: `Sent to ${recipientEmail}`,
        tenant_id: tenantId,
      });

      return { email_sent: true, recipient_email: recipientEmail, template };
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
        case "greater_than":
          result = Number(actualValue) > Number(value);
          break;
        case "less_than":
          result = Number(actualValue) < Number(value);
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

    /* ---- Create Invoice ---- */
    case "create_invoice": {
      const dueDate = new Date();
      if (resolved.due_date_offset_days) {
        dueDate.setDate(dueDate.getDate() + Number(resolved.due_date_offset_days));
      }

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          client_id: resolved.client_id || (context.entity_type === "client" ? context.entity_id : null),
          amount: Number(resolved.amount) || 0,
          due_date: dueDate.toISOString(),
          status: "draft",
          tenant_id: tenantId,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create invoice: ${error.message}`);
      return { created_invoice_id: invoice?.id };
    }

    /* ---- Create Client ---- */
    case "create_client": {
      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          name: resolved.name || "Untitled Client",
          email: resolved.email || null,
          phone: resolved.phone || null,
          company: resolved.company || null,
          status: "active",
          tenant_id: tenantId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create client: ${error.message}`);
      return { created_client_id: client?.id };
    }

    /* ---- Show Modal (in-app modal notification, shown once) ---- */
    case "send_banner": {
      const recipientType = resolved.recipient_type as string || "trigger_user";
      const bannerType = resolved.banner_type as string || "info";
      const title = resolved.title as string || "Workflow Notification";
      const message = resolved.message as string || "";
      const buttonText = resolved.button_text as string || "Got it";

      // Determine recipients
      let recipientIds: string[] = [];
      if (recipientType === "all_team") {
        const { data: teamMembers } = await supabase
          .from("profiles")
          .select("id")
          .eq("tenant_id", tenantId);
        recipientIds = (teamMembers || []).map((m: { id: string }) => m.id);
      } else if (recipientType === "specific_id" && resolved.recipient_id) {
        recipientIds = [resolved.recipient_id as string];
      } else {
        recipientIds = [userId];
      }

      // Create modal notifications for each recipient (shown once, center screen)
      const modalRows = recipientIds.map((uid) => ({
        user_id: uid,
        type: "modal",
        title: title,
        message: message,
        tenant_id: tenantId,
        action_url: null,
        read: false,
        metadata: { banner_type: bannerType, show_once: true, button_text: buttonText },
      }));

      const { error } = await supabase.from("notifications").insert(modalRows);
      if (error) throw new Error(`Failed to send modal: ${error.message}`);
      return { modal_sent: true, recipient_count: recipientIds.length };
    }

    /* ---- Send to Slack ---- */
    case "send_slack": {
      // Use step-level webhook URL first, then fall back to tenant integration
      let webhookUrl = resolved.webhook_url as string;
      let defaultChannel = resolved.channel as string;

      if (!webhookUrl) {
        const { data: slackConfig } = await supabase
          .from("tenant_integrations")
          .select("config")
          .eq("tenant_id", tenantId)
          .eq("provider", "slack")
          .eq("is_active", true)
          .single();

        if (slackConfig?.config) {
          const cfg = slackConfig.config as Record<string, string>;
          webhookUrl = cfg.webhook_url;
          if (!defaultChannel) defaultChannel = cfg.default_channel;
        }
      }

      if (!webhookUrl) throw new Error("Missing Slack webhook URL");

      const mention = resolved.mention as string;
      let text = resolved.message as string || "Workflow notification";
      if (mention === "channel") text = `<!channel> ${text}`;
      else if (mention === "here") text = `<!here> ${text}`;

      const slackPayload: Record<string, unknown> = { text };
      if (defaultChannel) {
        slackPayload.channel = defaultChannel;
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });

        return {
          slack_sent: response.ok,
          slack_status: response.status,
        };
      } catch (err) {
        throw new Error(`Slack webhook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Remove Tag ---- */
    case "remove_tag": {
      const entityId = (resolved.entity_id as string) || (context.entity_id as string);
      const entityType = (resolved.entity_type as string) || (context.entity_type as string);
      const tag = resolved.tag as string;

      if (!entityId || !entityType || !tag) {
        throw new Error("Missing entity_id, entity_type, or tag for remove_tag");
      }

      const tableName = entityType === "client" ? "clients" : entityType === "project" ? "projects" : entityType === "event" ? "events" : "tasks";

      const { data: entity } = await supabase
        .from(tableName)
        .select("tags")
        .eq("id", entityId)
        .single();

      const currentTags = Array.isArray(entity?.tags) ? entity.tags : [];
      const newTags = currentTags.filter((t: string) => t !== tag);

      if (newTags.length !== currentTags.length) {
        const { error } = await supabase
          .from(tableName)
          .update({ tags: newTags })
          .eq("id", entityId);

        if (error) throw new Error(`Failed to remove tag: ${error.message}`);
      }

      return { tag_removed: tag };
    }

    /* ---- HTTP Request (advanced webhook) ---- */
    case "http_request": {
      const url = resolved.url as string;
      if (!url) throw new Error("Missing HTTP request URL");

      const method = (resolved.method as string)?.toUpperCase() || "POST";
      const contentType = (resolved.content_type as string) || "application/json";
      const headers: Record<string, string> = { "Content-Type": contentType };

      if (resolved.auth_header) {
        headers["Authorization"] = resolved.auth_header as string;
      }

      // Parse custom headers
      if (resolved.headers_json) {
        try {
          const customHeaders = JSON.parse(resolved.headers_json as string);
          Object.assign(headers, customHeaders);
        } catch {
          // Ignore invalid JSON
        }
      }

      let body: string | undefined;
      if (method !== "GET" && method !== "HEAD") {
        if (resolved.body_json) {
          body = resolved.body_json as string;
        } else {
          body = JSON.stringify({
            workflow_id: context.workflow_id,
            run_id: runId,
            trigger_data: context,
          });
        }
      }

      try {
        const response = await fetch(url, { method, headers, body });
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text().catch(() => null);
        }

        return {
          http_status: response.status,
          http_ok: response.ok,
          http_response: responseBody,
        };
      } catch (err) {
        throw new Error(`HTTP request failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Log Activity ---- */
    case "log_activity": {
      const activityType = (resolved.activity_type as string) || "note";
      const description = (resolved.description as string) || "Workflow activity logged";

      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "activity",
        title: `Activity: ${activityType}`,
        message: description,
        tenant_id: tenantId,
        metadata: {
          activity_type: activityType,
          entity_id: context.entity_id,
          entity_type: context.entity_type,
          workflow_run_id: runId,
        },
      });

      if (error) throw new Error(`Failed to log activity: ${error.message}`);
      return { activity_logged: true, activity_type: activityType };
    }

    /* ---- Create Lead ---- */
    case "create_lead": {
      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          name: resolved.name || "Untitled Lead",
          email: resolved.email || null,
          company: resolved.company || null,
          source: resolved.source || null,
          estimated_value: resolved.estimated_value ? Number(resolved.estimated_value) : null,
          status: resolved.status || "new",
          tenant_id: tenantId,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create lead: ${error.message}`);
      return { created_lead_id: lead?.id };
    }

    /* ---- Create Contact ---- */
    case "create_contact": {
      const { data: contact, error } = await supabase
        .from("contacts")
        .insert({
          first_name: resolved.first_name || "",
          last_name: resolved.last_name || "",
          email: resolved.email || null,
          phone: resolved.phone || null,
          company: resolved.company || null,
          job_title: resolved.job_title || null,
          tenant_id: tenantId,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to create contact: ${error.message}`);
      return { created_contact_id: contact?.id };
    }

    /* ---- Send SMS ---- */
    case "send_sms": {
      const phoneNumber = resolved.phone_number as string;
      const message = (resolved.message as string) || "Workflow notification";

      if (!phoneNumber) throw new Error("Missing recipient phone number for send_sms");

      // Try tenant integration first, then fall back to env vars
      let twilioSid: string | undefined;
      let twilioToken: string | undefined;
      let twilioFrom: string | undefined;

      const { data: twilioConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "twilio")
        .eq("is_active", true)
        .single();

      if (twilioConfig?.config) {
        const cfg = twilioConfig.config as Record<string, string>;
        twilioSid = cfg.account_sid;
        twilioToken = cfg.auth_token;
        twilioFrom = cfg.phone_number;
      }

      // Fall back to env vars
      if (!twilioSid) twilioSid = process.env.TWILIO_SID;
      if (!twilioToken) twilioToken = process.env.TWILIO_TOKEN;
      if (!twilioFrom) twilioFrom = process.env.TWILIO_FROM;

      if (!twilioSid || !twilioToken || !twilioFrom) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "workflow",
          title: "SMS not sent (Twilio not configured)",
          message: `Would have sent to ${phoneNumber}: ${message}`,
          tenant_id: tenantId,
        });
        return { sms_sent: false, reason: "twilio_not_configured", phone_number: phoneNumber };
      }

      try {
        const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authString}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: phoneNumber,
              From: twilioFrom,
              Body: message,
            }).toString(),
          }
        );

        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok || responseBody.error_code) {
          const errMsg = responseBody.message || responseBody.error_message || `Twilio API error ${response.status}`;
          throw new Error(`SMS failed: ${errMsg} (code: ${responseBody.error_code || response.status})`);
        }

        return {
          sms_sent: true,
          sms_sid: responseBody.sid,
          sms_message_status: responseBody.status,
          phone_number: phoneNumber,
        };
      } catch (err) {
        throw new Error(`SMS failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Send WhatsApp ---- */
    case "send_whatsapp": {
      const phoneNumber = resolved.phone_number as string;
      const message = (resolved.message as string) || "Workflow notification";

      if (!phoneNumber) throw new Error("Missing recipient phone number for send_whatsapp");

      // Get WhatsApp integration credentials
      const { data: waConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "whatsapp")
        .eq("is_active", true)
        .single();

      if (!waConfig?.config) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "workflow",
          title: "WhatsApp not sent (not configured)",
          message: `Would have sent to ${phoneNumber}: ${message}`,
          tenant_id: tenantId,
        });
        return { whatsapp_sent: false, reason: "whatsapp_not_configured", phone_number: phoneNumber };
      }

      const cfg = waConfig.config as Record<string, string>;
      const apiToken = cfg.api_token;
      const phoneNumberId = cfg.phone_number_id;

      if (!apiToken || !phoneNumberId) {
        throw new Error("WhatsApp integration missing api_token or phone_number_id");
      }

      try {
        const templateName = resolved.template_name as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          messaging_product: "whatsapp",
          to: phoneNumber,
        };

        if (templateName) {
          payload.type = "template";
          payload.template = { name: templateName, language: { code: "en" } };
        } else {
          payload.type = "text";
          payload.text = { body: message };
        }

        const response = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        return {
          whatsapp_sent: response.ok,
          whatsapp_status: response.status,
          phone_number: phoneNumber,
        };
      } catch (err) {
        throw new Error(`WhatsApp send failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Schedule Action (advanced delay) ---- */
    case "schedule_action": {
      const scheduleType = (resolved.schedule_type as string) || "relative";
      const resumeAt = new Date();

      switch (scheduleType) {
        case "relative": {
          const amount = Number(resolved.delay_amount) || 1;
          const unit = (resolved.delay_unit as string) || "hours";
          if (unit === "minutes") resumeAt.setMinutes(resumeAt.getMinutes() + amount);
          else if (unit === "hours") resumeAt.setHours(resumeAt.getHours() + amount);
          else if (unit === "days") resumeAt.setDate(resumeAt.getDate() + amount);
          else if (unit === "weeks") resumeAt.setDate(resumeAt.getDate() + amount * 7);
          break;
        }
        case "fixed_time": {
          const timeStr = (resolved.execute_at_time as string) || "09:00";
          const [hours, minutes] = timeStr.split(":").map(Number);
          resumeAt.setHours(hours, minutes, 0, 0);
          if (resumeAt <= new Date()) resumeAt.setDate(resumeAt.getDate() + 1);
          break;
        }
        case "next_business_day": {
          const timeStr = (resolved.execute_at_time as string) || "09:00";
          const [hours, minutes] = timeStr.split(":").map(Number);
          resumeAt.setDate(resumeAt.getDate() + 1);
          while (resumeAt.getDay() === 0 || resumeAt.getDay() === 6) {
            resumeAt.setDate(resumeAt.getDate() + 1);
          }
          resumeAt.setHours(hours, minutes, 0, 0);
          break;
        }
      }

      await supabase
        .from("workflow_step_executions")
        .update({
          status: "waiting_delay",
          output: { resume_at: resumeAt.toISOString(), schedule_type: scheduleType },
        })
        .eq("id", stepExecId);

      await supabase
        .from("workflow_runs")
        .update({ status: "waiting_delay" })
        .eq("id", runId);

      return { __paused: true, resume_at: resumeAt.toISOString() };
    }

    /* ---- ElevenLabs Text-to-Speech → Twilio Voice Call ---- */
    case "elevenlabs_tts": {
      const text = (resolved.text as string);
      if (!text) throw new Error("Missing text for ElevenLabs TTS");

      const phoneNumber = (resolved.phone_number as string);
      const deliveryMethod = (resolved.delivery_method as string) || "call";

      const { data: elConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "elevenlabs")
        .eq("is_active", true)
        .single();

      if (!elConfig?.config) {
        throw new Error("ElevenLabs integration not configured. Go to Settings → Integrations to set it up.");
      }

      const cfg = elConfig.config as Record<string, string>;
      const apiKey = cfg.api_key;
      const voiceId = (resolved.voice_id as string) || cfg.voice_id || "21m00Tcm4TlvDq8ikWAM";
      const modelId = (resolved.model_id as string) || cfg.model_id || "eleven_multilingual_v2";

      if (!apiKey) throw new Error("ElevenLabs API key not configured");

      // Default built-in voices allowed on all plans (no library restriction)
      const FALLBACK_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

      async function callTTS(vid: string) {
        return fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: modelId,
            }),
          }
        );
      }

      try {
        let response = await callTTS(voiceId);
        let usedVoice = voiceId;

        // If the voice is restricted (402), retry with a default built-in voice
        if (response.status === 402 && voiceId !== FALLBACK_VOICE) {
          response = await callTTS(FALLBACK_VOICE);
          usedVoice = FALLBACK_VOICE;
        }

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(`ElevenLabs API error ${response.status}: ${errBody}`);
        }

        // Get audio bytes from the response
        const audioBuffer = await response.arrayBuffer();

        // If no phone number is provided, just generate and store the audio metadata
        if (!phoneNumber || deliveryMethod === "generate_only") {
          return {
            tts_generated: true,
            tts_voice_id: usedVoice,
            tts_model_id: modelId,
            tts_text_length: text.length,
            tts_voice_fallback: usedVoice !== voiceId,
            tts_delivery: "none",
          };
        }

        // Upload audio to Supabase Storage so Twilio can access it
        const fileName = `tts-${runId}-${stepId}-${Date.now()}.mp3`;

        // Use service role client for storage upload to bypass RLS
        const storageClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: uploadData, error: uploadError } = await storageClient.storage
          .from("tts-audio")
          .upload(fileName, Buffer.from(audioBuffer), {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload TTS audio: ${uploadError.message}`);
        }

        // Get public URL for the audio file
        const { data: urlData } = storageClient.storage
          .from("tts-audio")
          .getPublicUrl(uploadData.path);

        const audioUrl = urlData.publicUrl;

        // Make a Twilio voice call that plays the audio
        let twilioSid: string | undefined;
        let twilioToken: string | undefined;
        let twilioFrom: string | undefined;

        const { data: twilioConfig } = await supabase
          .from("tenant_integrations")
          .select("config")
          .eq("tenant_id", tenantId)
          .eq("provider", "twilio")
          .eq("is_active", true)
          .single();

        if (twilioConfig?.config) {
          const tcfg = twilioConfig.config as Record<string, string>;
          twilioSid = tcfg.account_sid;
          twilioToken = tcfg.auth_token;
          twilioFrom = tcfg.phone_number;
        }

        if (!twilioSid) twilioSid = process.env.TWILIO_SID;
        if (!twilioToken) twilioToken = process.env.TWILIO_TOKEN;
        if (!twilioFrom) twilioFrom = process.env.TWILIO_FROM;

        if (!twilioSid || !twilioToken || !twilioFrom) {
          throw new Error("Twilio not configured. Both ElevenLabs and Twilio integrations are required to make TTS phone calls.");
        }

        // Build TwiML to play the audio
        const twiml = `<Response><Play>${audioUrl}</Play></Response>`;

        const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const callResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authString}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: phoneNumber,
              From: twilioFrom,
              Twiml: twiml,
            }).toString(),
          }
        );

        const callBody = await callResponse.json().catch(() => ({}));

        if (!callResponse.ok || callBody.error_code) {
          const errMsg = callBody.message || `Twilio call failed: ${callResponse.status}`;
          throw new Error(`TTS call failed: ${errMsg} (code: ${callBody.error_code || callResponse.status})`);
        }

        return {
          tts_generated: true,
          tts_voice_id: usedVoice,
          tts_model_id: modelId,
          tts_text_length: text.length,
          tts_voice_fallback: usedVoice !== voiceId,
          tts_delivery: "call",
          tts_call_sid: callBody.sid,
          tts_call_status: callBody.status,
          tts_audio_url: audioUrl,
          tts_phone_number: phoneNumber,
        };
      } catch (err) {
        throw new Error(`ElevenLabs TTS failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- OpenAI Generate ---- */
    case "openai_generate": {
      const prompt = (resolved.prompt as string);
      if (!prompt) throw new Error("Missing prompt for OpenAI generate");

      const { data: oaiConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "openai")
        .eq("is_active", true)
        .single();

      if (!oaiConfig?.config) {
        throw new Error("OpenAI integration not configured. Go to Settings → Integrations to set it up.");
      }

      const cfg = oaiConfig.config as Record<string, string>;
      const apiKey = cfg.api_key;
      const model = (resolved.model as string) || cfg.model || "gpt-4o-mini";
      const orgId = cfg.organization_id;

      if (!apiKey) throw new Error("OpenAI API key not configured");

      const systemPrompt = (resolved.system_prompt as string) || "You are a helpful business assistant.";
      const maxTokens = Number(resolved.max_tokens) || 500;

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        if (orgId) headers["OpenAI-Organization"] = orgId;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || "";

        return {
          ai_response: aiResponse,
          ai_model: model,
          ai_tokens_used: data.usage?.total_tokens || 0,
        };
      } catch (err) {
        throw new Error(`OpenAI generate failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Stripe Payment Link ---- */
    case "stripe_payment_link": {
      const productName = (resolved.product_name as string) || "Payment";
      const amount = Number(resolved.amount);
      const currency = (resolved.currency as string) || "usd";
      const sendTo = (resolved.send_to as string) || "";

      if (!amount || amount <= 0) throw new Error("Missing or invalid amount for Stripe payment link");

      const { data: stripeConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "stripe")
        .eq("is_active", true)
        .single();

      if (!stripeConfig?.config) {
        // Show modal to the user explaining Stripe setup is required
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "modal",
          title: "Stripe Setup Required",
          message: "Your workflow tried to create a payment link, but Stripe is not configured yet.\n\nGo to Settings → Integrations → Stripe and add your Secret Key to enable payment links.",
          tenant_id: tenantId,
          read: false,
          metadata: { banner_type: "error", show_once: true, button_text: "Go to Settings" },
        });
        throw new Error("Stripe integration not configured. A setup prompt has been sent to the user.");
      }

      const cfg = stripeConfig.config as Record<string, string>;
      const secretKey = cfg.secret_key;
      if (!secretKey) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "modal",
          title: "Stripe Secret Key Missing",
          message: "Your Stripe integration is connected but the Secret Key is missing.\n\nGo to Settings → Integrations → Stripe and enter your sk_live_... or sk_test_... key.",
          tenant_id: tenantId,
          read: false,
          metadata: { banner_type: "error", show_once: true, button_text: "Go to Settings" },
        });
        throw new Error("Stripe secret key not configured. A setup prompt has been sent to the user.");
      }

      const authString = Buffer.from(`${secretKey}:`).toString("base64");

      try {
        // 1. Create a product
        const productRes = await fetch("https://api.stripe.com/v1/products", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ name: productName }).toString(),
        });
        if (!productRes.ok) {
          const errBody = await productRes.json().catch(() => ({}));
          const errMsg = (errBody as { error?: { message?: string } })?.error?.message || `HTTP ${productRes.status}`;
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "modal",
            title: "Stripe Payment Failed",
            message: `Could not create the Stripe product.\n\nError: ${errMsg}\n\nPlease check your Stripe Secret Key in Settings → Integrations → Stripe. Make sure you're using a valid key (sk_live_... or sk_test_...).`,
            tenant_id: tenantId,
            read: false,
            metadata: { banner_type: "error", show_once: true, button_text: "Got it" },
          });
          throw new Error(`Stripe product creation failed: ${errMsg}`);
        }
        const product = await productRes.json();

        // 2. Create a price
        const priceRes = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            product: product.id,
            unit_amount: String(amount),
            currency,
          }).toString(),
        });
        if (!priceRes.ok) throw new Error(`Stripe price creation failed: ${priceRes.status}`);
        const price = await priceRes.json();

        // 3. Create a payment link
        const linkParams: Record<string, string> = {
          "line_items[0][price]": price.id,
          "line_items[0][quantity]": "1",
        };
        const customerEmail = resolved.customer_email as string;
        if (customerEmail) {
          linkParams["after_completion[type]"] = "redirect";
          linkParams["after_completion[redirect][url]"] = "https://example.com/thank-you";
        }

        const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(linkParams).toString(),
        });
        if (!linkRes.ok) throw new Error(`Stripe payment link creation failed: ${linkRes.status}`);
        const paymentLink = await linkRes.json();

        // 4. Send the payment link via email if send_to is provided
        if (sendTo) {
          const currencySymbol: Record<string, string> = { usd: "$", eur: "€", gbp: "£", aed: "AED ", aud: "A$", cad: "C$" };
          const sym = currencySymbol[currency] || currency.toUpperCase() + " ";
          const displayAmount = (amount / 100).toFixed(2);
          try {
            await sendEmail({
              to: sendTo,
              subject: `Payment Request: ${productName} — ${sym}${displayAmount}`,
              html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">Payment Request</h2>
  <p style="color:#666;margin:0 0 24px">You have a payment of <strong>${sym}${displayAmount}</strong> for <strong>${productName}</strong>.</p>
  <a href="${paymentLink.url}" style="display:inline-block;background:#635BFF;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Pay Now</a>
  <p style="color:#999;font-size:12px;margin:24px 0 0">If the button doesn't work, copy this link:<br/><a href="${paymentLink.url}" style="color:#635BFF">${paymentLink.url}</a></p>
</div>`,
              tenantId,
            });
          } catch (emailErr) {
            console.error("Failed to send payment link email:", emailErr);
          }
        }

        return {
          payment_link_url: paymentLink.url,
          payment_link_id: paymentLink.id,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          payment_amount: amount,
          payment_currency: currency,
        };
      } catch (err) {
        throw new Error(`Stripe payment link failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Google Calendar Event ---- */
    case "google_calendar_event": {
      const summary = (resolved.summary as string) || "Workflow Event";

      const { data: gcalConfig } = await supabase
        .from("tenant_integrations")
        .select("config")
        .eq("tenant_id", tenantId)
        .eq("provider", "google_calendar")
        .eq("is_active", true)
        .single();

      if (!gcalConfig?.config) {
        throw new Error("Google Calendar integration not configured. Go to Settings → Integrations to set it up.");
      }

      const cfg = gcalConfig.config as Record<string, string>;
      const clientId = cfg.client_id;
      const clientSecret = cfg.client_secret;
      const refreshToken = cfg.refresh_token;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Google Calendar credentials incomplete");
      }

      try {
        // Exchange refresh token for access token
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }).toString(),
        });

        if (!tokenRes.ok) throw new Error(`Google OAuth token refresh failed: ${tokenRes.status}`);
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // Build event start/end times
        const offsetDays = Number(resolved.start_offset_days) || 1;
        const startTime = (resolved.start_time as string) || "09:00";
        const durationMinutes = Number(resolved.duration_minutes) || 30;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + offsetDays);
        const [hours, minutes] = startTime.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventBody: Record<string, any> = {
          summary,
          description: (resolved.description as string) || "",
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
        };

        const attendeeEmail = resolved.attendee_email as string;
        if (attendeeEmail) {
          eventBody.attendees = [{ email: attendeeEmail }];
        }

        const eventRes = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
          }
        );

        if (!eventRes.ok) {
          const errBody = await eventRes.text().catch(() => "");
          throw new Error(`Google Calendar API error ${eventRes.status}: ${errBody}`);
        }

        const createdEvent = await eventRes.json();
        return {
          calendar_event_id: createdEvent.id,
          calendar_event_link: createdEvent.htmlLink,
          calendar_event_start: startDate.toISOString(),
          calendar_event_end: endDate.toISOString(),
        };
      } catch (err) {
        throw new Error(`Google Calendar event failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    /* ---- Zapier Trigger (Webhook) ---- */
    case "zapier_trigger": {
      let webhookUrl = resolved.webhook_url as string;

      if (!webhookUrl) {
        const { data: zapierConfig } = await supabase
          .from("tenant_integrations")
          .select("config")
          .eq("tenant_id", tenantId)
          .eq("provider", "zapier")
          .eq("is_active", true)
          .single();

        if (!zapierConfig?.config) {
          throw new Error("Zapier integration not configured. Go to Settings → Integrations to set it up.");
        }

        const cfg = zapierConfig.config as Record<string, string>;
        webhookUrl = cfg.webhook_url;
      }

      if (!webhookUrl) throw new Error("Missing Zapier webhook URL");

      // Build payload: use custom JSON if provided, otherwise send trigger context
      let payload: Record<string, unknown>;
      if (resolved.payload_json) {
        try {
          payload = JSON.parse(resolved.payload_json as string);
        } catch {
          payload = { raw: resolved.payload_json };
        }
      } else {
        payload = {
          workflow_id: context.workflow_id,
          run_id: runId,
          entity_id: context.entity_id,
          entity_type: context.entity_type,
          entity_name: context.entity_name,
          trigger_data: context,
          timestamp: new Date().toISOString(),
        };
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return {
          zapier_sent: response.ok,
          zapier_status: response.status,
        };
      } catch (err) {
        throw new Error(`Zapier webhook failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      throw new Error(`Unknown step type: ${stepType}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Resolve the recipient user ID based on `recipient_type` config.
 * - "trigger_user" (default): the user who triggered the workflow
 * - "entity_owner": looks up assigned_to/project_manager from the entity
 * - "specific_id": uses the explicit recipient_id from config
 */
async function resolveRecipientId(
  resolved: Record<string, unknown>,
  context: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<string> {
  const recipientType = (resolved.recipient_type as string) || "trigger_user";

  switch (recipientType) {
    case "entity_owner": {
      const entityId = (context.entity_id as string);
      const entityType = (context.entity_type as string);
      if (entityId && entityType) {
        const tableName = entityType === "project" ? "projects"
          : entityType === "event" ? "events"
          : entityType === "task" ? "tasks"
          : null;
        if (tableName) {
          const ownerField = entityType === "project" ? "project_manager_id" : "assigned_to";
          const { data } = await supabase
            .from(tableName)
            .select(ownerField)
            .eq("id", entityId)
            .single();
          if (data && (data as Record<string, unknown>)[ownerField]) return (data as Record<string, unknown>)[ownerField] as string;
        }
      }
      return userId; // fallback
    }
    case "specific_id":
      return (resolved.recipient_id as string) || userId;
    case "trigger_user":
    default:
      return userId;
  }
}

/**
 * Resolve recipient email based on `recipient_type` config.
 * - "trigger_user": email of the user who triggered the workflow
 * - "entity_owner": email of the entity owner/assignee
 * - "specific": uses the explicit recipient_email from config (can be a variable like {{client_email}})
 */
async function resolveRecipientEmail(
  resolved: Record<string, unknown>,
  context: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
  _tenantId: string
): Promise<{ email: string | null; name: string }> {
  const recipientType = (resolved.recipient_type as string) || "trigger_user";

  switch (recipientType) {
    case "specific": {
      // Direct email address (could be from a variable like {{client_email}})
      const email = (resolved.recipient_email as string) || null;
      const name = (context.entity_name as string) || (context.client_name as string) || "there";
      return { email, name };
    }
    case "entity_owner": {
      const entityId = (context.entity_id as string);
      const entityType = (context.entity_type as string);
      if (entityId && entityType) {
        // For clients, look up from clients table directly
        if (entityType === "client") {
          const { data: client } = await supabase
            .from("clients")
            .select("email, name")
            .eq("id", entityId)
            .single();
          if (client?.email) return { email: client.email, name: client.name || "there" };
        }
        // For other entities, find the owner's profile
        const tableName = entityType === "project" ? "projects"
          : entityType === "event" ? "events"
          : entityType === "task" ? "tasks"
          : null;
        if (tableName) {
          const ownerField = entityType === "project" ? "project_manager_id" : "assigned_to";
          const { data: entity } = await supabase
            .from(tableName)
            .select(ownerField)
            .eq("id", entityId)
            .single();
          if (entity && (entity as Record<string, unknown>)[ownerField]) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, first_name, last_name")
              .eq("id", (entity as Record<string, unknown>)[ownerField] as string)
              .single();
            if (profile?.email) {
              return {
                email: profile.email,
                name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "there",
              };
            }
          }
        }
      }
      // fallback to trigger user
      break;
    }
    case "trigger_user":
    default:
      break;
  }

  // Default: look up the triggering user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    return {
      email: profile.email,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "there",
    };
  }

  // Fallback: if no profile found (e.g. public registration trigger), use attendee data from context
  if (context.attendee_email) {
    return {
      email: context.attendee_email as string,
      name: (context.attendee_name as string) || "there",
    };
  }

  // Last resort: check for any email-like field in context
  const contextEmail = (context.client_email || context.lead_email || context.entity_email) as string | undefined;
  const contextName = (context.entity_name || context.client_name || context.lead_name) as string | undefined;
  return {
    email: contextEmail || null,
    name: contextName || "there",
  };
}

async function markRunStatus(supabase: SupabaseClient, runId: string, status: string) {
  await supabase
    .from("workflow_runs")
    .update({ status, completed_at: new Date().toISOString() })
    .eq("id", runId);
}

/**
 * Replace {{variable}} placeholders in config string values with context values.
 * Supports:
 * - Simple variables: {{entity_id}}
 * - Dot-notation for nested objects: {{trigger.entity_name}}
 * - Built-in variables: {{now}} (ISO date), {{today}} (YYYY-MM-DD), {{run_id}}
 */
function resolveTemplates(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      resolved[key] = value.replace(/\{\{([\w.]+)\}\}/g, (_, varName: string) => {
        // Built-in variables
        if (varName === "now") return new Date().toISOString();
        if (varName === "today") return new Date().toISOString().slice(0, 10);
        if (varName === "run_id") return String(context.run_id ?? "");

        // Support dot-notation traversal (e.g. "trigger.entity_name")
        const parts = varName.split(".");
        let current: unknown = context;
        for (const part of parts) {
          if (current === null || current === undefined || typeof current !== "object") {
            return "";
          }
          current = (current as Record<string, unknown>)[part];
        }

        return current !== undefined && current !== null ? String(current) : "";
      });
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
