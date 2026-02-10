import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// GET - Calculate client health scores
export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

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

    // Fetch all data in parallel
    const [
      clientsResult,
      invoicesResult,
      projectsResult,
      activityLogsResult,
      contractsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, email, company, status")
        .eq("tenant_id", tenantId),

      supabase
        .from("invoices")
        .select("id, client_id, status")
        .eq("tenant_id", tenantId),

      supabase
        .from("projects")
        .select("id, client_id, status, progress_percentage")
        .eq("tenant_id", tenantId),

      supabase
        .from("activity_logs")
        .select("entity_id, created_at")
        .eq("tenant_id", tenantId)
        .eq("entity_type", "client")
        .order("created_at", { ascending: false }),

      supabase
        .from("contracts")
        .select("id, client_id, status")
        .eq("tenant_id", tenantId),
    ]);

    const clients = clientsResult.data || [];
    const invoices = invoicesResult.data || [];
    const projects = projectsResult.data || [];
    const activityLogs = activityLogsResult.data || [];
    const contracts = contractsResult.data || [];

    const now = new Date();

    // Calculate health score for each client
    const clientHealth = clients.map((client) => {
      // --- Payment health (30%) ---
      const clientInvoices = invoices.filter((i) => i.client_id === client.id);
      let paymentScore: number;
      if (clientInvoices.length === 0) {
        paymentScore = 70;
      } else {
        const paidCount = clientInvoices.filter((i) => i.status === "paid").length;
        paymentScore = (paidCount / clientInvoices.length) * 100;
      }

      // --- Project progress (25%) ---
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      let projectScore: number;
      if (clientProjects.length === 0) {
        projectScore = 50;
      } else {
        projectScore =
          clientProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
          clientProjects.length;
      }

      // --- Communication recency (20%) ---
      const clientActivity = activityLogs.find((a) => a.entity_id === client.id);
      let communicationScore: number;
      let lastActivity: string | null = null;
      if (!clientActivity) {
        communicationScore = 30;
      } else {
        lastActivity = clientActivity.created_at;
        const daysSince = Math.floor(
          (now.getTime() - new Date(clientActivity.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSince < 7) communicationScore = 100;
        else if (daysSince < 14) communicationScore = 80;
        else if (daysSince < 30) communicationScore = 60;
        else if (daysSince < 60) communicationScore = 40;
        else communicationScore = 20;
      }

      // --- Contract status (15%) ---
      const clientContracts = contracts.filter((c) => c.client_id === client.id);
      let contractScore: number;
      if (clientContracts.length === 0) {
        contractScore = 30;
      } else if (clientContracts.some((c) => c.status === "active")) {
        contractScore = 100;
      } else {
        contractScore = 60;
      }

      // --- Invoice health (10%) ---
      const overdueCount = clientInvoices.filter((i) => i.status === "overdue").length;
      const invoiceHealthScore =
        overdueCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 25);

      // Weighted total
      const healthScore = Math.round(
        paymentScore * 0.3 +
          projectScore * 0.25 +
          communicationScore * 0.2 +
          contractScore * 0.15 +
          invoiceHealthScore * 0.1
      );

      // Risk level
      let riskLevel: "healthy" | "at_risk" | "critical";
      if (healthScore > 70) riskLevel = "healthy";
      else if (healthScore >= 40) riskLevel = "at_risk";
      else riskLevel = "critical";

      // Alerts
      const alerts: string[] = [];
      if (overdueCount > 0) {
        alerts.push(`${overdueCount} invoice${overdueCount > 1 ? "s" : ""} overdue`);
      }
      if (!clientActivity) {
        alerts.push("No activity recorded");
      } else {
        const daysSince = Math.floor(
          (now.getTime() - new Date(clientActivity.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSince >= 30) {
          alerts.push("No activity in 30+ days");
        }
      }
      if (!clientContracts.some((c) => c.status === "active")) {
        alerts.push("No active contract");
      }

      // Active projects count
      const activeProjects = clientProjects.filter((p) =>
        ["active", "in_progress"].includes(p.status)
      ).length;

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company || null,
        status: client.status,
        healthScore,
        scoreBreakdown: {
          payment: Math.round(paymentScore),
          project: Math.round(projectScore),
          communication: Math.round(communicationScore),
          contract: Math.round(contractScore),
          invoice: Math.round(invoiceHealthScore),
        },
        trend: "stable" as const,
        riskLevel,
        lastActivity,
        overdueInvoices: overdueCount,
        activeProjects,
        alerts,
      };
    });

    // Sort by healthScore ascending (worst first)
    clientHealth.sort((a, b) => a.healthScore - b.healthScore);

    // Summary
    const healthy = clientHealth.filter((c) => c.riskLevel === "healthy").length;
    const atRisk = clientHealth.filter((c) => c.riskLevel === "at_risk").length;
    const critical = clientHealth.filter((c) => c.riskLevel === "critical").length;
    const averageScore =
      clientHealth.length > 0
        ? Math.round(
            clientHealth.reduce((sum, c) => sum + c.healthScore, 0) / clientHealth.length
          )
        : 0;

    return NextResponse.json({
      summary: {
        total: clientHealth.length,
        healthy,
        atRisk,
        critical,
        averageScore,
      },
      clients: clientHealth,
    });
  } catch (error) {
    console.error("Client health error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
