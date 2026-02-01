import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get("workflow_id");
    const status = searchParams.get("status");

    let query = supabase
      .from("workflow_runs")
      .select("*, workflow:workflow_id(name), step_executions:workflow_step_executions(id, step_id, status, error_message, output, started_at, completed_at)")
      .eq("tenant_id", tenantId)
      .order("started_at", { ascending: false });

    if (workflowId) {
      query = query.eq("workflow_id", workflowId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.limit(200);

    const { data: runs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("GET /api/workflows/runs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
