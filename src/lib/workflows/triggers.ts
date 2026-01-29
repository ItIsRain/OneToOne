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
