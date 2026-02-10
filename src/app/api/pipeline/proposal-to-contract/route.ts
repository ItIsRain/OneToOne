import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { mapProposalToContractSections } from "@/lib/pipeline/utils";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Feature gate
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }
    const access = checkFeatureAccess(planInfo.planType, "sow_pipeline");
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, upgrade_required: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { proposal_id } = body;

    if (!proposal_id) {
      return NextResponse.json(
        { error: "proposal_id is required" },
        { status: 400 }
      );
    }

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status !== "accepted") {
      return NextResponse.json(
        { error: "Proposal must be accepted to generate a contract" },
        { status: 400 }
      );
    }

    // Duplicate check: no contract already linked to this proposal
    const { data: existingContract } = await supabase
      .from("contracts")
      .select("id")
      .eq("proposal_id", proposal_id)
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle();

    if (existingContract) {
      return NextResponse.json(
        {
          error: "A contract already exists for this proposal",
          contract_id: existingContract.id,
        },
        { status: 409 }
      );
    }

    // Map proposal sections to contract sections
    const sections = Array.isArray(proposal.sections)
      ? proposal.sections
      : [];
    const contractSections = mapProposalToContractSections(sections);

    // Create contract
    const contractData = {
      tenant_id: profile.tenant_id,
      name: proposal.title,
      client_id: proposal.client_id,
      proposal_id: proposal.id,
      value: proposal.total || 0,
      currency: proposal.currency || "USD",
      contract_type: "project_contract",
      status: "draft",
      sections: contractSections,
      description: `Generated from proposal: ${proposal.title}`,
      tags: ["pipeline:auto-generated"],
      created_by: userId,
    };

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert(contractData)
      .select("*")
      .single();

    if (contractError) {
      console.error("Pipeline contract creation error:", contractError);
      return NextResponse.json(
        { error: contractError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Pipeline proposal-to-contract error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
