import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

interface Milestone {
  id: string;
  type: string;
  title: string;
  date: string;
  amount: number | null;
  metadata: Record<string, unknown> | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;

    // Fetch the client record and verify it belongs to tenant
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, company, status, email, created_at")
      .eq("id", clientId)
      .eq("tenant_id", tenantId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [
      invoicesResult,
      projectsResult,
      proposalsResult,
      contractsResult,
      paymentsResult,
      activityResult,
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, status, total, amount_paid, created_at, due_date")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),

      supabase
        .from("projects")
        .select("id, name, status, progress_percentage, created_at")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),

      supabase
        .from("proposals")
        .select("id, title, status, created_at")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),

      supabase
        .from("contracts")
        .select("id, name, status, created_at")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),

      supabase
        .from("payments")
        .select("id, amount, payment_date, status")
        .eq("tenant_id", tenantId)
        .eq("client_id", clientId)
        .order("payment_date", { ascending: true }),

      supabase
        .from("activity_logs")
        .select("id, action, description, created_at")
        .eq("tenant_id", tenantId)
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const invoices = invoicesResult.data || [];
    const projects = projectsResult.data || [];
    const proposals = proposalsResult.data || [];
    const contracts = contractsResult.data || [];
    const payments = paymentsResult.data || [];

    // Build milestones array
    const milestones: Milestone[] = [];
    let counter = 1;

    // Client created
    milestones.push({
      id: `m${counter++}`,
      type: "client_created",
      title: "Client Created",
      date: client.created_at,
      amount: null,
      metadata: null,
    });

    // Proposals
    for (const proposal of proposals) {
      milestones.push({
        id: `m${counter++}`,
        type: "proposal_sent",
        title: `Proposal: ${proposal.title || "Untitled"}`,
        date: proposal.created_at,
        amount: null,
        metadata: { proposal_id: proposal.id, status: proposal.status },
      });

      if (proposal.status === "accepted" || proposal.status === "signed") {
        milestones.push({
          id: `m${counter++}`,
          type: "proposal_accepted",
          title: `Proposal Accepted: ${proposal.title || "Untitled"}`,
          date: proposal.created_at,
          amount: null,
          metadata: { proposal_id: proposal.id },
        });
      }
    }

    // Contracts
    for (const contract of contracts) {
      if (
        contract.status === "active" ||
        contract.status === "signed" ||
        contract.status === "completed"
      ) {
        milestones.push({
          id: `m${counter++}`,
          type: "contract_signed",
          title: `Contract Signed: ${contract.name || "Untitled"}`,
          date: contract.created_at,
          amount: null,
          metadata: { contract_id: contract.id, status: contract.status },
        });
      }
    }

    // Projects
    for (const project of projects) {
      milestones.push({
        id: `m${counter++}`,
        type: "project_started",
        title: `Project Started: ${project.name || "Untitled"}`,
        date: project.created_at,
        amount: null,
        metadata: {
          project_id: project.id,
          status: project.status,
          progress: project.progress_percentage,
        },
      });

      if (project.status === "completed") {
        milestones.push({
          id: `m${counter++}`,
          type: "project_completed",
          title: `Project Completed: ${project.name || "Untitled"}`,
          date: project.created_at,
          amount: null,
          metadata: { project_id: project.id },
        });
      }
    }

    // Invoices
    for (const invoice of invoices) {
      milestones.push({
        id: `m${counter++}`,
        type: "invoice_sent",
        title: `Invoice #${invoice.id.slice(0, 8)}`,
        date: invoice.created_at,
        amount: invoice.total || 0,
        metadata: {
          invoice_id: invoice.id,
          status: invoice.status,
          due_date: invoice.due_date,
        },
      });
    }

    // Payments (completed only)
    const completedPayments = payments.filter(
      (p) => p.status === "completed" || p.status === "paid"
    );
    for (const payment of completedPayments) {
      milestones.push({
        id: `m${counter++}`,
        type: "payment_received",
        title: `Payment Received: $${(payment.amount || 0).toLocaleString()}`,
        date: payment.payment_date,
        amount: payment.amount || 0,
        metadata: { payment_id: payment.id },
      });
    }

    // Sort milestones by date ascending
    milestones.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate phases
    const firstProposalDate = proposals.length > 0 ? proposals[0].created_at : null;
    const firstContractDate = contracts.length > 0 ? contracts[0].created_at : null;
    const firstProjectDate = projects.length > 0 ? projects[0].created_at : null;
    const lastCompletedProject = projects
      .filter((p) => p.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    const onboardingStart = firstProposalDate || firstContractDate || null;
    const activeStart = firstProjectDate || null;
    const activeEnd = lastCompletedProject?.created_at || null;

    // Retention: if client age > 6 months from first project
    let retentionStart: string | null = null;
    if (firstProjectDate) {
      const sixMonthsAfter = new Date(firstProjectDate);
      sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);
      if (new Date() >= sixMonthsAfter) {
        retentionStart = sixMonthsAfter.toISOString();
      }
    }

    const phases = {
      acquisition: {
        start: client.created_at,
        end: firstProposalDate || null,
      },
      onboarding: {
        start: onboardingStart,
        end: firstProjectDate || null,
      },
      active: {
        start: activeStart,
        end: activeEnd,
      },
      retention: {
        start: retentionStart,
        end: null,
      },
    };

    // Calculate cumulative revenue
    const cumulativeRevenue: { date: string; total: number }[] = [];
    let runningTotal = 0;
    for (const payment of completedPayments) {
      runningTotal += payment.amount || 0;
      cumulativeRevenue.push({
        date: payment.payment_date,
        total: runningTotal,
      });
    }

    const totalRevenue = runningTotal;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        status: client.status,
        created_at: client.created_at,
      },
      totalRevenue,
      phases,
      milestones,
      cumulativeRevenue,
      counts: {
        invoices: invoices.length,
        projects: projects.length,
        proposals: proposals.length,
        contracts: contracts.length,
        payments: completedPayments.length,
      },
    });
  } catch (error) {
    console.error("Client journey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
