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
      // For task_status_changed, filter by matching from_status/to_status
      if (triggerType === "task_status_changed") {
        const triggerConfig = workflow.trigger_config as Record<string, unknown> | null;

        if (triggerConfig) {
          if (
            triggerConfig.from_status &&
            triggerConfig.from_status !== triggerData.from_status
          ) {
            continue;
          }

          if (
            triggerConfig.to_status &&
            triggerConfig.to_status !== triggerData.to_status
          ) {
            continue;
          }
        }
      }

      await executeWorkflow(workflow.id, triggerData, supabase, userId, tenantId);
    } catch (err) {
      console.error(
        `Failed to execute workflow ${workflow.id} for trigger ${triggerType}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}
