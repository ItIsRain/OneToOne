import { SupabaseClient } from "@supabase/supabase-js";
import { executeWorkflow } from "./engine";

export async function checkTriggers(
  triggerType: string,
  triggerData: Record<string, unknown>,
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<void> {
  // Query active workflows matching the trigger type and tenant
  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("status", "active")
    .eq("trigger_type", triggerType)
    .eq("tenant_id", tenantId);

  if (error || !workflows) {
    console.error("Failed to fetch workflows for trigger check:", error?.message);
    return;
  }

  for (const workflow of workflows) {
    try {
      const triggerConfig = workflow.trigger_config as Record<string, unknown> | null;

      // Filter workflows by trigger-specific config
      if (triggerConfig) {
        let skip = false;

        switch (triggerType) {
          case "task_status_changed": {
            if (triggerConfig.from_status && triggerConfig.from_status !== triggerData.from_status) skip = true;
            if (triggerConfig.to_status && triggerConfig.to_status !== triggerData.to_status) skip = true;
            break;
          }
          case "lead_created": {
            if (triggerConfig.source && triggerConfig.source !== triggerData.lead_source) skip = true;
            break;
          }
          case "payment_received": {
            if (triggerConfig.min_amount && Number(triggerData.payment_amount) < Number(triggerConfig.min_amount)) skip = true;
            break;
          }
          case "invoice_overdue": {
            if (triggerConfig.min_days_overdue && Number(triggerData.days_overdue) < Number(triggerConfig.min_days_overdue)) skip = true;
            break;
          }
          case "event_registration": {
            if (triggerConfig.event_id && triggerConfig.event_id !== triggerData.event_id) skip = true;
            if (triggerConfig.event_type && triggerConfig.event_type !== triggerData.event_type) skip = true;
            break;
          }
          case "project_status_changed": {
            if (triggerConfig.from_status && triggerConfig.from_status !== triggerData.from_status) skip = true;
            if (triggerConfig.to_status && triggerConfig.to_status !== triggerData.to_status) skip = true;
            break;
          }
          case "lead_status_changed": {
            if (triggerConfig.from_status && triggerConfig.from_status !== triggerData.from_status) skip = true;
            if (triggerConfig.to_status && triggerConfig.to_status !== triggerData.to_status) skip = true;
            break;
          }
          case "client_status_changed": {
            if (triggerConfig.from_status && triggerConfig.from_status !== triggerData.from_status) skip = true;
            if (triggerConfig.to_status && triggerConfig.to_status !== triggerData.to_status) skip = true;
            break;
          }
          case "task_completed": {
            // Always fires when a task is completed — no filter needed
            break;
          }
          case "contact_created": {
            // Always fires on contact creation — no filter needed
            break;
          }
          case "task_created": {
            if (triggerConfig.priority && triggerConfig.priority !== triggerData.priority) skip = true;
            break;
          }
          case "invoice_created": {
            if (triggerConfig.min_amount && Number(triggerData.invoice_amount) < Number(triggerConfig.min_amount)) skip = true;
            break;
          }
          case "form_submitted": {
            if (triggerConfig.form_id && triggerConfig.form_id !== triggerData.form_id) skip = true;
            break;
          }
          case "form_published": {
            // Always fires when a form is published — no filter needed
            break;
          }
          case "proposal_created": {
            // Always fires on proposal creation — no filter needed
            break;
          }
          case "proposal_sent": {
            // Always fires when a proposal is sent — no filter needed
            break;
          }
          case "proposal_viewed": {
            // Always fires when a proposal is viewed — no filter needed
            break;
          }
          case "proposal_accepted": {
            // Always fires when a proposal is accepted — no filter needed
            break;
          }
          case "proposal_declined": {
            // Always fires when a proposal is declined — no filter needed
            break;
          }
          case "deliverable_approved": {
            // Always fires when a deliverable is approved — no filter needed
            break;
          }
          case "deliverable_rejected": {
            // Always fires when a deliverable is rejected — no filter needed
            break;
          }
          case "portal_file_uploaded": {
            // Always fires when a portal file is uploaded — no filter needed
            break;
          }
          case "portal_client_login": {
            // Always fires on portal client login — no filter needed
            break;
          }
        }

        if (skip) continue;
      }

      await executeWorkflow(workflow.id, triggerData, supabase, userId, tenantId);
    } catch (err) {
      console.error(
        `[TRIGGER] Failed to execute workflow ${workflow.id} for trigger ${triggerType}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}
