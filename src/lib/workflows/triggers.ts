import { SupabaseClient } from "@supabase/supabase-js";
import { executeWorkflow } from "./engine";

const MAX_TRIGGER_DEPTH = 5;

/**
 * Check and execute workflows matching the given trigger.
 *
 * @param triggerType - The type of trigger (e.g., "task_created")
 * @param triggerData - Data associated with the trigger event
 * @param supabase - Supabase client instance
 * @param tenantId - Tenant ID for isolation
 * @param userId - User ID who triggered the event
 * @param currentDepth - Current recursion depth (default 0). Pass this through when
 *                       workflows trigger other events to prevent infinite loops.
 */
export async function checkTriggers(
  triggerType: string,
  triggerData: Record<string, unknown>,
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  currentDepth: number = 0
): Promise<void> {
  // Prevent infinite workflow loops - depth is passed through the call chain
  // This is thread-safe as each workflow chain tracks its own depth
  if (currentDepth >= MAX_TRIGGER_DEPTH) {
    console.warn(`[TRIGGER] Max trigger depth (${MAX_TRIGGER_DEPTH}) reached for ${triggerType}, skipping to prevent infinite loop`);
    return;
  }

  // Store depth in triggerData so nested workflows can access it
  const dataWithDepth = { ...triggerData, __workflowDepth: currentDepth + 1 };
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
          case "booking_created": {
            if (triggerConfig.booking_page_id && triggerConfig.booking_page_id !== triggerData.booking_page_id) skip = true;
            break;
          }
          case "booking_cancelled": {
            if (triggerConfig.booking_page_id && triggerConfig.booking_page_id !== triggerData.booking_page_id) skip = true;
            break;
          }
          case "booking_rescheduled": {
            if (triggerConfig.booking_page_id && triggerConfig.booking_page_id !== triggerData.booking_page_id) skip = true;
            break;
          }
          case "event_ended": {
            if (triggerConfig.event_id && triggerConfig.event_id !== triggerData.event_id) skip = true;
            if (triggerConfig.event_type && triggerConfig.event_type !== triggerData.event_type) skip = true;
            break;
          }
          case "survey_response_submitted": {
            if (triggerConfig.survey_id && triggerConfig.survey_id !== triggerData.survey_id) skip = true;
            break;
          }
          case "contract_created": {
            // Always fires on contract creation — no filter needed
            break;
          }
          case "contract_sent": {
            // Always fires when a contract is sent — no filter needed
            break;
          }
          case "contract_signed": {
            // Always fires when a contract is signed — no filter needed
            break;
          }
          case "vendor_created": {
            // Always fires on vendor creation — no filter needed
            break;
          }
          case "vendor_status_changed": {
            if (triggerConfig.from_status && triggerConfig.from_status !== triggerData.from_status) skip = true;
            if (triggerConfig.to_status && triggerConfig.to_status !== triggerData.to_status) skip = true;
            break;
          }
          case "form_created": {
            // Always fires on form creation — no filter needed
            break;
          }
        }

        if (skip) continue;
      }

      await executeWorkflow(workflow.id, dataWithDepth, supabase, userId, tenantId);
    } catch (err) {
      console.error(
        `[TRIGGER] Failed to execute workflow ${workflow.id} for trigger ${triggerType}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}
