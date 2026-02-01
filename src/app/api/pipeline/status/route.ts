import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get("proposal_id");
    const contractId = searchParams.get("contract_id");
    const projectId = searchParams.get("project_id");

    if (!proposalId && !contractId && !projectId) {
      return NextResponse.json(
        { error: "Provide proposal_id, contract_id, or project_id" },
        { status: 400 }
      );
    }

    const tenantId = profile.tenant_id;
    let proposal = null;
    let contract = null;
    let project = null;
    let milestones: unknown[] = [];
    let invoices: unknown[] = [];

    // Trace the chain starting from whichever entity was provided
    if (proposalId) {
      const { data } = await supabase
        .from("proposals")
        .select("id, title, status, total, currency, client_id")
        .eq("id", proposalId)
        .eq("tenant_id", tenantId)
        .single();
      proposal = data;

      if (proposal) {
        const { data: c } = await supabase
          .from("contracts")
          .select("id, name, status, value, currency, project_id, is_signed")
          .eq("proposal_id", proposal.id)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        contract = c;
      }
    }

    if (contractId && !contract) {
      const { data } = await supabase
        .from("contracts")
        .select("id, name, status, value, currency, project_id, is_signed, proposal_id")
        .eq("id", contractId)
        .eq("tenant_id", tenantId)
        .single();
      contract = data;

      // Trace back to proposal
      if (contract?.proposal_id && !proposal) {
        const { data: p } = await supabase
          .from("proposals")
          .select("id, title, status, total, currency, client_id")
          .eq("id", contract.proposal_id)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        proposal = p;
      }
    }

    // Get project from contract or directly
    const resolvedProjectId = projectId || contract?.project_id;
    if (resolvedProjectId) {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, budget, currency, client_id")
        .eq("id", resolvedProjectId)
        .eq("tenant_id", tenantId)
        .single();
      project = data;

      // If started from project_id, trace back to contract
      if (projectId && !contract) {
        const { data: c } = await supabase
          .from("contracts")
          .select("id, name, status, value, currency, project_id, is_signed, proposal_id")
          .eq("project_id", projectId)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        contract = c;

        if (c?.proposal_id && !proposal) {
          const { data: p } = await supabase
            .from("proposals")
            .select("id, title, status, total, currency, client_id")
            .eq("id", c.proposal_id)
            .eq("tenant_id", tenantId)
            .maybeSingle();
          proposal = p;
        }
      }
    }

    // Fetch milestone tasks for the project
    if (project) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, notes, due_date, tags")
        .eq("project_id", project.id)
        .eq("tenant_id", tenantId)
        .contains("tags", ["pipeline:milestone"]);

      milestones = tasks || [];

      // Fetch invoices for the project
      const { data: invs } = await supabase
        .from("invoices")
        .select("id, invoice_number, reference_number, title, total, status, currency")
        .eq("project_id", project.id)
        .eq("tenant_id", tenantId);

      invoices = invs || [];
    }

    // Determine current stage
    let currentStage = "proposal";
    if (contract) currentStage = "contract";
    if (project) currentStage = "project";
    if (invoices.length > 0) currentStage = "invoicing";

    return NextResponse.json({
      proposal,
      contract,
      project,
      milestones,
      invoices,
      current_stage: currentStage,
    });
  } catch (error) {
    console.error("Pipeline status error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
