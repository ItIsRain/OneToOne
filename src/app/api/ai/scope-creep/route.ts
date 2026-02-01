import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rate limiter: 10 requests per 60 seconds per user
const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(userId: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.reset) {
    rateMap.set(userId, { count: 1, reset: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeRelation(row: any): any {
  if (!row) return null;
  if (Array.isArray(row)) return row[0] || null;
  return row;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const tenantId = profile.tenant_id;
    const url = new URL(request.url);
    const projectId = url.searchParams.get("project_id");

    // Fetch projects with linked proposals, contracts, tasks, time entries, invoices
    const [projectsRes, proposalsRes, contractsRes, tasksRes, timeEntriesRes, invoicesRes] = await Promise.all([
      projectId
        ? supabase
            .from("projects")
            .select("id, name, project_code, status, budget, currency, estimated_hours, start_date, end_date, deadline, billing_type, hourly_rate, client:clients(id, name, company)")
            .eq("tenant_id", tenantId)
            .eq("id", projectId)
        : supabase
            .from("projects")
            .select("id, name, project_code, status, budget, currency, estimated_hours, start_date, end_date, deadline, billing_type, hourly_rate, client:clients(id, name, company)")
            .eq("tenant_id", tenantId)
            .in("status", ["active", "planning"]),

      supabase
        .from("proposals")
        .select("id, title, project_id, sections, pricing_items, total, status")
        .eq("tenant_id", tenantId)
        .in("status", ["signed", "sent"]),

      supabase
        .from("contracts")
        .select("id, name, project_id, proposal_id, sections, value, status, start_date, end_date")
        .eq("tenant_id", tenantId)
        .in("status", ["signed", "active"]),

      supabase
        .from("tasks")
        .select("id, title, description, category, project_id, status, priority, estimated_hours, actual_hours, due_date, start_date, created_at, tags")
        .eq("tenant_id", tenantId)
        .not("status", "eq", "cancelled"),

      supabase
        .from("time_entries")
        .select("id, project_id, user_id, duration_minutes, hourly_rate, is_billable, date")
        .eq("tenant_id", tenantId)
        .not("status", "eq", "rejected"),

      supabase
        .from("invoices")
        .select("id, project_id, total, amount, amount_paid, status")
        .eq("tenant_id", tenantId)
        .not("status", "in", '("draft","cancelled","refunded")'),
    ]);

    const projects = projectsRes.data || [];
    const proposals = proposalsRes.data || [];
    const contracts = contractsRes.data || [];
    const tasks = tasksRes.data || [];
    const timeEntries = timeEntriesRes.data || [];
    const invoices = invoicesRes.data || [];

    // Build per-project analysis
    const analyses = projects.map((proj) => {
      const client = safeRelation(proj.client);
      const projProposals = proposals.filter((p) => p.project_id === proj.id);
      const projContracts = contracts.filter((c) => c.project_id === proj.id);
      const projTasks = tasks.filter((t) => t.project_id === proj.id);
      const projTime = timeEntries.filter((te) => te.project_id === proj.id);
      const projInvoices = invoices.filter((inv) => inv.project_id === proj.id);

      // Calculate metrics
      const totalEstimatedHours = projTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      const totalActualHours = projTime.reduce((s, te) => s + (te.duration_minutes || 0) / 60, 0);
      const totalLaborCost = projTime.reduce((s, te) => s + ((te.duration_minutes || 0) / 60) * (te.hourly_rate || 0), 0);
      const totalInvoiced = projInvoices.reduce((s, inv) => s + (inv.total || inv.amount || 0), 0);
      const taskCount = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.status === "completed").length;

      // Original scope from proposal
      let originalScope: string[] = [];
      let originalBudget = proj.budget || 0;
      let originalHours = proj.estimated_hours || 0;

      for (const prop of projProposals) {
        // Extract deliverables from pricing_items
        if (prop.pricing_items && Array.isArray(prop.pricing_items)) {
          for (const item of prop.pricing_items) {
            if (item.description || item.name || item.title) {
              originalScope.push(item.description || item.name || item.title);
            }
          }
        }
        // Extract from sections
        if (prop.sections && Array.isArray(prop.sections)) {
          for (const section of prop.sections) {
            if (section.title) originalScope.push(section.title);
          }
        }
        if (prop.total && prop.total > originalBudget) originalBudget = prop.total;
      }

      for (const contract of projContracts) {
        if (contract.value && contract.value > originalBudget) originalBudget = contract.value;
        if (contract.sections && Array.isArray(contract.sections)) {
          for (const section of contract.sections) {
            if (section.title) originalScope.push(section.title);
          }
        }
      }

      // Scope creep indicators
      const indicators: { type: string; severity: "low" | "medium" | "high"; message: string; value?: number }[] = [];

      // Hours overrun
      if (originalHours > 0 && totalActualHours > originalHours) {
        const overrunPct = Math.round(((totalActualHours - originalHours) / originalHours) * 100);
        indicators.push({
          type: "hours_overrun",
          severity: overrunPct > 50 ? "high" : overrunPct > 20 ? "medium" : "low",
          message: `${overrunPct}% over estimated hours (${Math.round(totalActualHours)}h actual vs ${originalHours}h estimated)`,
          value: overrunPct,
        });
      }

      // Budget overrun
      if (originalBudget > 0 && totalLaborCost > originalBudget) {
        const overrunPct = Math.round(((totalLaborCost - originalBudget) / originalBudget) * 100);
        indicators.push({
          type: "budget_overrun",
          severity: overrunPct > 30 ? "high" : overrunPct > 10 ? "medium" : "low",
          message: `Labor cost exceeds budget by ${overrunPct}%`,
          value: overrunPct,
        });
      }

      // Estimated vs actual hours on tasks
      const tasksWithEstimates = projTasks.filter((t) => t.estimated_hours && t.estimated_hours > 0);
      const totalTaskEstimated = tasksWithEstimates.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      if (totalTaskEstimated > 0 && totalEstimatedHours > originalHours * 1.2 && originalHours > 0) {
        indicators.push({
          type: "scope_expansion",
          severity: totalEstimatedHours > originalHours * 1.5 ? "high" : "medium",
          message: `Task estimates total ${Math.round(totalEstimatedHours)}h vs original ${originalHours}h project estimate`,
        });
      }

      // Tasks created after project started (potential scope additions)
      const projectStart = proj.start_date ? new Date(proj.start_date) : null;
      if (projectStart) {
        const lateAddedTasks = projTasks.filter((t) => {
          const created = new Date(t.created_at);
          const daysSinceStart = (created.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceStart > 14; // Tasks created more than 2 weeks after start
        });
        if (lateAddedTasks.length > taskCount * 0.3 && lateAddedTasks.length >= 3) {
          indicators.push({
            type: "late_additions",
            severity: lateAddedTasks.length > taskCount * 0.5 ? "high" : "medium",
            message: `${lateAddedTasks.length} of ${taskCount} tasks added after project started`,
          });
        }
      }

      // Deadline approaching/passed with incomplete work
      if (proj.deadline) {
        const deadline = new Date(proj.deadline);
        const now = new Date();
        const daysToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const completionRate = taskCount > 0 ? completedTasks / taskCount : 0;

        if (daysToDeadline < 0 && completionRate < 1) {
          indicators.push({
            type: "deadline_passed",
            severity: "high",
            message: `Deadline passed ${Math.abs(Math.round(daysToDeadline))} days ago with ${Math.round(completionRate * 100)}% completion`,
          });
        } else if (daysToDeadline < 14 && completionRate < 0.7) {
          indicators.push({
            type: "deadline_risk",
            severity: "medium",
            message: `${Math.round(daysToDeadline)} days to deadline with only ${Math.round(completionRate * 100)}% complete`,
          });
        }
      }

      // Revenue vs cost gap
      if (totalInvoiced > 0 && totalLaborCost > totalInvoiced * 0.8) {
        indicators.push({
          type: "margin_erosion",
          severity: totalLaborCost > totalInvoiced ? "high" : "medium",
          message: `Labor cost (${formatCurrency(totalLaborCost)}) is ${totalLaborCost > totalInvoiced ? "exceeding" : "approaching"} invoiced revenue (${formatCurrency(totalInvoiced)})`,
        });
      }

      // Calculate risk score
      const severityScores = { low: 1, medium: 3, high: 5 };
      const riskScore = indicators.reduce((s, i) => s + severityScores[i.severity], 0);
      const riskLevel = riskScore >= 8 ? "high" : riskScore >= 4 ? "medium" : riskScore > 0 ? "low" : "none";

      return {
        project: {
          id: proj.id,
          name: proj.name,
          project_code: proj.project_code,
          status: proj.status,
          client_name: client?.name || null,
          budget: originalBudget,
          estimated_hours: originalHours,
          deadline: proj.deadline,
          currency: proj.currency || "USD",
        },
        metrics: {
          task_count: taskCount,
          completed_tasks: completedTasks,
          total_estimated_hours: Math.round(totalEstimatedHours * 10) / 10,
          total_actual_hours: Math.round(totalActualHours * 10) / 10,
          total_labor_cost: Math.round(totalLaborCost * 100) / 100,
          total_invoiced: Math.round(totalInvoiced * 100) / 100,
          has_proposal: projProposals.length > 0,
          has_contract: projContracts.length > 0,
        },
        original_scope: originalScope.slice(0, 20), // Cap at 20 items
        indicators,
        risk_score: riskScore,
        risk_level: riskLevel,
      };
    });

    // Sort by risk score descending
    analyses.sort((a, b) => b.risk_score - a.risk_score);

    // Summary stats
    const atRisk = analyses.filter((a) => a.risk_level === "high" || a.risk_level === "medium");
    const totalUnscopedValue = analyses.reduce((s, a) => {
      const overrunHours = Math.max(a.metrics.total_actual_hours - (a.project.estimated_hours || 0), 0);
      const avgRate = a.metrics.total_actual_hours > 0 ? a.metrics.total_labor_cost / a.metrics.total_actual_hours : 0;
      return s + overrunHours * avgRate;
    }, 0);

    return NextResponse.json({
      analyses,
      summary: {
        total_projects: analyses.length,
        high_risk: analyses.filter((a) => a.risk_level === "high").length,
        medium_risk: analyses.filter((a) => a.risk_level === "medium").length,
        low_risk: analyses.filter((a) => a.risk_level === "low").length,
        no_risk: analyses.filter((a) => a.risk_level === "none").length,
        at_risk_count: atRisk.length,
        estimated_unscoped_value: Math.round(totalUnscopedValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Scope creep analysis error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - AI-powered deep analysis for a specific project
export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRate(user.id)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id required" }, { status: 400 });
    }

    const tenantId = userProfile.tenant_id;

    // Fetch all data for this project
    const [projRes, proposalsRes, contractsRes, tasksRes, timeRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", project_id).eq("tenant_id", tenantId).single(),
      supabase.from("proposals").select("title, sections, pricing_items, total, status").eq("project_id", project_id).eq("tenant_id", tenantId),
      supabase.from("contracts").select("name, sections, value, status, terms_and_conditions").eq("project_id", project_id).eq("tenant_id", tenantId),
      supabase.from("tasks").select("title, description, category, status, estimated_hours, actual_hours, due_date, created_at, tags").eq("project_id", project_id).eq("tenant_id", tenantId),
      supabase.from("time_entries").select("duration_minutes, hourly_rate, is_billable, date, description").eq("project_id", project_id).eq("tenant_id", tenantId),
    ]);

    const project = projRes.data;
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build context for AI
    const proposalScope = (proposalsRes.data || []).map((p) => ({
      title: p.title,
      deliverables: p.pricing_items,
      sections: p.sections?.map((s: { title: string }) => s.title),
    }));

    const contractScope = (contractsRes.data || []).map((c) => ({
      name: c.name,
      sections: c.sections?.map((s: { title: string }) => s.title),
      value: c.value,
    }));

    const taskSummary = (tasksRes.data || []).map((t) => ({
      title: t.title,
      category: t.category,
      status: t.status,
      estimated_hours: t.estimated_hours,
      created: t.created_at?.slice(0, 10),
    }));

    const totalHoursLogged = (timeRes.data || []).reduce((s, te) => s + (te.duration_minutes || 0) / 60, 0);

    const systemPrompt = `You are a project management analyst specializing in scope creep detection for agencies. Analyze the project data provided and identify scope creep risks.

Return a JSON object with this exact structure:
{
  "risk_summary": "1-2 sentence overall assessment",
  "scope_creep_items": [
    {
      "title": "Short title of the issue",
      "description": "Explanation of the scope creep or risk",
      "severity": "high" | "medium" | "low",
      "estimated_impact_hours": number or null,
      "recommendation": "What to do about it"
    }
  ],
  "change_order_needed": true | false,
  "change_order_reason": "Why a change order should be created" or null,
  "estimated_unscoped_value": number (dollar estimate of out-of-scope work),
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
}

Be specific and practical. Focus on identifying work that falls outside the original scope defined in proposals/contracts.`;

    const userMessage = `Analyze this project for scope creep:

PROJECT: ${project.name}
Budget: $${project.budget || "Not set"}
Estimated Hours: ${project.estimated_hours || "Not set"}
Start Date: ${project.start_date || "Not set"}
Deadline: ${project.deadline || "Not set"}
Status: ${project.status}
Hours Logged: ${Math.round(totalHoursLogged)}h

ORIGINAL SCOPE (from proposals):
${JSON.stringify(proposalScope, null, 2)}

CONTRACTS:
${JSON.stringify(contractScope, null, 2)}

CURRENT TASKS (${taskSummary.length} total):
${JSON.stringify(taskSummary, null, 2)}`;

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { risk_summary: content, scope_creep_items: [], recommendations: [] };
    } catch {
      analysis = { risk_summary: content, scope_creep_items: [], recommendations: [] };
    }

    return NextResponse.json({ analysis, project_id });
  } catch (error) {
    console.error("AI scope creep analysis error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
