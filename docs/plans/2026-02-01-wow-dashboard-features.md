# WOW Dashboard Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 high-impact dashboard features — Agency Command Center, Client Health Scores, Resource Planning Heatmap, and Client Journey Map — to transform the dashboard into a world-class agency management experience.

**Architecture:** Each feature is a new dashboard widget component following the existing pattern (`"use client"`, Framer Motion animations, fetch from API routes, loading/error states). New API routes aggregate data from existing Supabase tables. New widgets register in the widget registry and integrate into the dashboard page's customizable widget system. Since the command palette already exists, we skip that and focus on the 4 visual features.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion 12, ApexCharts 4, Supabase (PostgreSQL), existing `useCountUp` hook.

---

## Feature 1: Agency Command Center

A full-screen cinematic analytics view with animated counters, pipeline funnel, team utilization bars, project status rings, and glassmorphism cards.

### Task 1: Create the Command Center API route

**Files:**
- Create: `src/app/api/dashboard/command-center/route.ts`

**Step 1: Create the API route**

This route aggregates comprehensive analytics data from existing tables. It follows the exact same pattern as `src/app/api/dashboard/stats/route.ts`.

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Build last 6 months date ranges for revenue chart
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    const revenuePromises = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = mStart.toLocaleDateString("en-US", { month: "short" });
      revenuePromises.push(
        supabase
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("payment_date", mStart.toISOString())
          .lte("payment_date", mEnd.toISOString())
          .then((res) => ({
            month: monthLabel,
            revenue: (res.data || []).reduce((s, p) => s + (p.amount || 0), 0),
          }))
      );
    }

    const [
      clientsResult,
      leadsResult,
      projectsResult,
      tasksResult,
      invoicesResult,
      paymentsResult,
      teamResult,
      todayEventsResult,
      todayTasksResult,
      ...revenueResults
    ] = await Promise.all([
      // All clients by status
      supabase.from("clients").select("id, status, created_at").eq("tenant_id", tenantId),
      // All leads by status
      supabase.from("leads").select("id, status").eq("tenant_id", tenantId),
      // All projects with progress
      supabase.from("projects").select("id, status, progress_percentage, budget").eq("tenant_id", tenantId),
      // All tasks
      supabase.from("tasks").select("id, status, priority, due_date, assigned_to").eq("tenant_id", tenantId),
      // All invoices
      supabase.from("invoices").select("id, status, total, amount_paid").eq("tenant_id", tenantId),
      // Payments this month
      supabase.from("payments").select("amount").eq("tenant_id", tenantId).eq("status", "completed").gte("payment_date", startOfMonth),
      // Team members with tasks assigned
      supabase.from("profiles").select("id, full_name, avatar_url, role").eq("tenant_id", tenantId),
      // Today's events
      supabase.from("events").select("id, name, start_date").eq("tenant_id", tenantId)
        .gte("start_date", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .lt("start_date", new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()),
      // Today's tasks due
      supabase.from("tasks").select("id, title, due_date, status, priority").eq("tenant_id", tenantId)
        .eq("due_date", now.toISOString().split("T")[0])
        .in("status", ["todo", "in_progress"]),
      ...revenuePromises,
    ]);

    const clients = clientsResult.data || [];
    const leads = leadsResult.data || [];
    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const invoices = invoicesResult.data || [];
    const team = teamResult.data || [];

    // Revenue this month
    const monthlyRevenueTotal = (paymentsResult.data || []).reduce((s, p) => s + (p.amount || 0), 0);

    // Pipeline funnel: leads -> qualified -> proposal -> won
    const pipeline = {
      newLeads: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      proposal: leads.filter((l) => l.status === "proposal").length,
      won: leads.filter((l) => l.status === "won" || l.status === "converted").length,
    };

    // Team utilization (tasks assigned / capacity proxy)
    const teamUtilization = team.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
      const activeTasks = memberTasks.filter((t) => t.status === "in_progress" || t.status === "todo").length;
      const completedTasks = memberTasks.filter((t) => t.status === "completed" || t.status === "done").length;
      return {
        id: member.id,
        name: member.full_name || "Unknown",
        avatar: member.avatar_url,
        role: member.role,
        activeTasks,
        completedTasks,
        utilization: Math.min(activeTasks * 20, 100), // Rough: 5 tasks = 100%
      };
    });

    // Project status distribution
    const projectStatus = {
      active: projects.filter((p) => p.status === "active" || p.status === "in_progress").length,
      onTrack: projects.filter((p) => (p.progress_percentage || 0) >= 50 && p.status !== "completed").length,
      atRisk: projects.filter((p) => (p.progress_percentage || 0) < 30 && (p.status === "active" || p.status === "in_progress")).length,
      completed: projects.filter((p) => p.status === "completed").length,
      onHold: projects.filter((p) => p.status === "on_hold").length,
    };

    // Invoice summary
    const invoiceSummary = {
      totalOutstanding: invoices.filter((i) => ["sent", "viewed", "overdue"].includes(i.status)).reduce((s, i) => s + ((i.total || 0) - (i.amount_paid || 0)), 0),
      paid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0),
      overdue: invoices.filter((i) => i.status === "overdue").length,
    };

    // Overdue tasks count
    const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed" && t.status !== "done").length;

    // Today's deadlines
    const todayDeadlines = [
      ...(todayEventsResult.data || []).map((e) => ({ type: "event" as const, title: e.name, time: e.start_date })),
      ...(todayTasksResult.data || []).map((t) => ({ type: "task" as const, title: t.title, time: t.due_date, priority: t.priority })),
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      revenue: {
        thisMonth: monthlyRevenueTotal,
        chart: revenueResults as { month: string; revenue: number }[],
      },
      clients: {
        total: clients.length,
        active: clients.filter((c) => c.status === "active").length,
      },
      pipeline,
      projects: {
        total: projects.length,
        ...projectStatus,
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length,
        overdue: overdueTasks,
      },
      invoices: invoiceSummary,
      teamUtilization: teamUtilization.slice(0, 10), // Cap at 10
      todayDeadlines: todayDeadlines.slice(0, 8),
      teamCount: team.length,
    });
  } catch (error) {
    console.error("Command center error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
```

**Step 2: Verify the route compiles**

Run: `npx next build --no-lint 2>&1 | head -20` or start dev server and hit the endpoint.

**Step 3: Commit**

```bash
git add src/app/api/dashboard/command-center/route.ts
git commit -m "feat: add command center API route for aggregated analytics"
```

---

### Task 2: Build the Agency Command Center component

**Files:**
- Create: `src/components/agency/dashboard/AgencyCommandCenter.tsx`

**Step 1: Build the full-screen command center component**

This is the main visual component. It renders a full-screen overlay with animated metrics, charts, and glassmorphism cards. Uses `useCountUp` for animated numbers, `framer-motion` for entrance animations, and `react-apexcharts` (dynamically imported) for charts.

Key sections:
1. **Header bar** with "Command Center" title and close button
2. **Top row**: 4 big animated metric cards (Revenue, Active Clients, Projects, Pending Tasks) with glassmorphism styling
3. **Middle row**: Revenue sparkline chart (ApexCharts area), Pipeline funnel visualization (custom CSS bars), Project status donut chart (ApexCharts donut)
4. **Bottom row**: Team utilization bars with avatars, Today's deadlines ticker

Design notes:
- Dark gradient background: `bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950`
- Glassmorphism cards: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`
- Accent glow effects: subtle `shadow-[0_0_30px_rgba(111,191,0,0.15)]` using brand green
- All text white/gray for dark overlay
- Framer Motion stagger animations for card entrance
- `useCountUp` for all numbers
- Full viewport overlay with `fixed inset-0 z-[99999]`
- Escape key to close
- Responsive: stacks on mobile

The component accepts `isOpen: boolean` and `onClose: () => void` props.

For the pipeline funnel: Use horizontal bars with decreasing widths (100% -> 80% -> 60% -> 40% -> 20%) with gradient colors from brand-400 to brand-600.

For team utilization: Horizontal progress bars with avatar + name + percentage. Color-coded: green <70%, yellow 70-90%, red >90%.

For the revenue chart: Use `react-apexcharts` area chart, dynamically imported with `next/dynamic`, 6-month data, brand-green gradient fill.

For project status: ApexCharts donut with labels.

For the today deadlines section: A horizontal scrolling row of small cards with time + title + type badge.

**Step 2: Verify it renders**

Import into dashboard page temporarily and test with `isOpen={true}`.

**Step 3: Commit**

```bash
git add src/components/agency/dashboard/AgencyCommandCenter.tsx
git commit -m "feat: add Agency Command Center full-screen analytics component"
```

---

### Task 3: Integrate Command Center into the dashboard

**Files:**
- Modify: `src/components/agency/dashboard/index.ts` — add export
- Modify: `src/app/(admin)/dashboard/page.tsx` — add trigger button + component

**Step 1: Export from barrel file**

Add to `src/components/agency/dashboard/index.ts`:
```typescript
export { AgencyCommandCenter } from "./AgencyCommandCenter";
```

**Step 2: Add to dashboard page**

In `src/app/(admin)/dashboard/page.tsx`:
1. Import `AgencyCommandCenter` from the dashboard barrel
2. Add state: `const [commandCenterOpen, setCommandCenterOpen] = useState(false);`
3. Add a "Command Center" button next to the existing "Customize" button in the top-right section
4. Render `<AgencyCommandCenter isOpen={commandCenterOpen} onClose={() => setCommandCenterOpen(false)} />` alongside the other modals

The button should have a rocket/chart icon and say "Command Center" with a subtle gradient border.

**Step 3: Test and commit**

```bash
git add src/components/agency/dashboard/index.ts src/app/(admin)/dashboard/page.tsx
git commit -m "feat: integrate command center into dashboard with trigger button"
```

---

## Feature 2: Client Health Score Dashboard

An intelligent risk monitoring widget showing health scores for each client with color-coded cards, trend indicators, and risk alerts.

### Task 4: Create the Client Health Score API route

**Files:**
- Create: `src/app/api/dashboard/client-health/route.ts`

**Step 1: Create the API route**

This route calculates a health score (0-100) for each client based on:
- **Payment health (30%)**: On-time payments vs overdue. Score = (paid_invoices / total_invoices) * 100
- **Project progress (25%)**: Average progress of their projects. Higher = better.
- **Communication recency (20%)**: Days since last activity log entry for this client. Recent = better.
- **Contract status (15%)**: Active contract = good, expired/none = bad.
- **Invoice health (10%)**: No overdue invoices = 100, any overdue = proportionally lower.

Follow the exact same auth + tenant pattern as the stats route.

Query these tables in parallel:
- `clients` (all clients with status)
- `invoices` (grouped by client_id, check status)
- `projects` (grouped by client_id, check progress)
- `activity_logs` (most recent per client, for communication score)
- `contracts` (active contracts per client)

Return array of:
```typescript
{
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  healthScore: number; // 0-100
  scoreBreakdown: {
    payment: number;
    project: number;
    communication: number;
    contract: number;
    invoice: number;
  };
  trend: "up" | "down" | "stable"; // Compare to 30 days ago if possible, else "stable"
  riskLevel: "healthy" | "at_risk" | "critical"; // >70 healthy, 40-70 at_risk, <40 critical
  lastActivity: string | null; // ISO date
  overdueInvoices: number;
  activeProjects: number;
  alerts: string[]; // e.g., "2 invoices overdue", "No activity in 30 days"
}
```

Also return summary:
```typescript
{
  summary: {
    total: number;
    healthy: number;
    atRisk: number;
    critical: number;
    averageScore: number;
  },
  clients: ClientHealth[]
}
```

**Step 2: Commit**

```bash
git add src/app/api/dashboard/client-health/route.ts
git commit -m "feat: add client health score API with multi-factor scoring algorithm"
```

---

### Task 5: Build the Client Health Score widget component

**Files:**
- Create: `src/components/agency/dashboard/ClientHealthWidget.tsx`

**Step 1: Build the widget component**

This is a dashboard widget (matching existing widget style) that shows:

1. **Summary bar** at top: 4 mini stat badges — Total Clients, Healthy (green), At Risk (yellow), Critical (red) — with the count in each. Plus an "Avg Score" circular gauge.

2. **Client list** below: A scrollable list (max 6 visible, scroll for more) of client health cards. Each card shows:
   - Client name + company on the left
   - Circular health score indicator (SVG circle with stroke-dasharray for progress ring)
   - Score number in center of ring
   - Color: green (#22c55e) for healthy, amber (#f59e0b) for at-risk, red (#ef4444) for critical
   - Trend arrow (ArrowUpIcon green / ArrowDownIcon red / dash gray)
   - Alert badges if any (e.g., "2 overdue" in red badge)

3. **Hover state**: Card expands slightly to show score breakdown bars (5 mini horizontal bars for each factor)

Design:
- Card wrapper: `rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5`
- Section title: "Client Health" with a heart-pulse icon or shield icon
- Loading: skeleton cards (same as DashboardMetrics pattern)
- Error: error state with retry button (same pattern)
- Empty state: "No clients yet" message

The circular score indicator is a pure SVG element:
```tsx
<svg viewBox="0 0 36 36" className="w-12 h-12">
  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
    fill="none" stroke={color} strokeWidth="3"
    strokeDasharray={`${score}, 100`}
    strokeLinecap="round" />
  <text x="18" y="20.5" textAnchor="middle" className="text-[10px] font-bold fill-current">{score}</text>
</svg>
```

**Step 2: Commit**

```bash
git add src/components/agency/dashboard/ClientHealthWidget.tsx
git commit -m "feat: add client health score dashboard widget with visual indicators"
```

---

### Task 6: Register Client Health widget and integrate into dashboard

**Files:**
- Modify: `src/lib/dashboard/widgetRegistry.ts` — add `client_health` widget
- Modify: `src/components/agency/dashboard/DashboardCustomizePanel.tsx` — add `show_client_health` to settings interface and visibility map
- Modify: `src/components/agency/dashboard/index.ts` — add export
- Modify: `src/app/(admin)/dashboard/page.tsx` — add to widget rendering

**Step 1: Register widget**

Add to `widgetRegistry` array:
```typescript
{ key: "client_health", label: "Client Health", column: "left" },
```

Add `"client_health"` to `defaultWidgetOrder` array (after "upcoming").

Add to `defaultVisibility`:
```typescript
client_health: true,
```

**Step 2: Update DashboardSettings type**

Add `show_client_health: boolean` to the `DashboardSettings` interface in `DashboardCustomizePanel.tsx`.

Add to `visibilityKeys`:
```typescript
client_health: "show_client_health",
```

**Step 3: Update dashboard page**

In `page.tsx`:
- Import `ClientHealthWidget`
- Add `show_client_health: true` to `defaultSettings`
- Add to `isVisible` map: `client_health: dashSettings.show_client_health`
- Add case in `renderLeftWidget`:
  ```typescript
  case "client_health":
    return <ClientHealthWidget key={`client_health-${refreshKey}`} />;
  ```

**Step 4: Export from barrel**

Add to `src/components/agency/dashboard/index.ts`:
```typescript
export { ClientHealthWidget } from "./ClientHealthWidget";
```

**Step 5: Commit**

```bash
git add src/lib/dashboard/widgetRegistry.ts src/components/agency/dashboard/DashboardCustomizePanel.tsx src/components/agency/dashboard/index.ts src/app/(admin)/dashboard/page.tsx
git commit -m "feat: integrate client health widget into dashboard widget system"
```

---

## Feature 3: Resource Planning Heatmap

A visual calendar heatmap showing team capacity across weeks with color-coded availability.

### Task 7: Create the Resource Heatmap API route

**Files:**
- Create: `src/app/api/dashboard/resource-heatmap/route.ts`

**Step 1: Create the API route**

This route returns team member utilization data across the next 4 weeks (or current + next 3 weeks).

For each team member, for each week:
- Count tasks assigned with due dates in that week
- Count tasks currently in progress
- Calculate a utilization percentage (tasks / 5 capacity baseline * 100, capped at 100)

Follow same auth/tenant pattern.

Query:
- `profiles` for team members
- `tasks` for all tasks with assigned_to and due_date in the next 4 weeks range

Return:
```typescript
{
  weeks: string[]; // ["Jan 27", "Feb 3", "Feb 10", "Feb 17"]
  weekRanges: { start: string; end: string }[]; // ISO date ranges
  members: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    weeks: {
      taskCount: number;
      utilization: number; // 0-100
      tasks: { id: string; title: string; priority: string }[];
    }[];
    averageUtilization: number;
  }[];
  summary: {
    weekAverages: number[]; // Average utilization per week across all members
    overbooked: number; // Members with any week >100%
    available: number; // Members with all weeks <50%
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/dashboard/resource-heatmap/route.ts
git commit -m "feat: add resource heatmap API for team capacity data"
```

---

### Task 8: Build the Resource Heatmap widget component

**Files:**
- Create: `src/components/agency/dashboard/ResourceHeatmap.tsx`

**Step 1: Build the heatmap widget**

This widget shows a grid/table:
- **Rows**: Team members (avatar + name on left)
- **Columns**: 4 weeks (week label on top)
- **Cells**: Color-coded squares showing utilization

Color scale for cells:
- 0%: `bg-gray-50 dark:bg-gray-800/50` (empty/available)
- 1-40%: `bg-emerald-100 dark:bg-emerald-900/30` with `text-emerald-700` (light load)
- 41-70%: `bg-amber-100 dark:bg-amber-900/30` with `text-amber-700` (moderate)
- 71-90%: `bg-orange-100 dark:bg-orange-900/30` with `text-orange-700` (busy)
- 91-100%+: `bg-red-100 dark:bg-red-900/30` with `text-red-700` (overbooked)

Each cell shows the utilization percentage number. On hover, show a tooltip with task names.

Layout:
- Card wrapper matching existing widget style
- Title: "Team Capacity" with a grid icon
- Summary row at top: "X available, Y busy, Z overbooked" as colored badges
- Below: the heatmap grid
- Bottom: legend showing the color scale

The tooltip on hover shows:
- "3 tasks this week"
- List of task titles (max 3, "+N more" if more)

Use Framer Motion for stagger animation on cells loading in.

Loading state: skeleton grid matching the shape.

**Step 2: Commit**

```bash
git add src/components/agency/dashboard/ResourceHeatmap.tsx
git commit -m "feat: add resource planning heatmap widget with color-coded capacity"
```

---

### Task 9: Register Resource Heatmap widget and integrate into dashboard

**Files:**
- Modify: `src/lib/dashboard/widgetRegistry.ts` — add widget
- Modify: `src/components/agency/dashboard/DashboardCustomizePanel.tsx` — add setting
- Modify: `src/components/agency/dashboard/index.ts` — add export
- Modify: `src/app/(admin)/dashboard/page.tsx` — add rendering

**Step 1: Register widget**

Add to `widgetRegistry`:
```typescript
{ key: "resource_heatmap", label: "Team Capacity", column: "full" },
```

This is a `full` width widget because heatmaps need horizontal space.

Add `"resource_heatmap"` to `defaultWidgetOrder` (after "onboarding").

Add to `defaultVisibility`: `resource_heatmap: true`

**Step 2: Update settings**

Add `show_resource_heatmap: boolean` to `DashboardSettings` interface.

Add to `visibilityKeys`: `resource_heatmap: "show_resource_heatmap"`

**Step 3: Update dashboard page**

- Import `ResourceHeatmap`
- Add `show_resource_heatmap: true` to `defaultSettings`
- Add to `isVisible` map
- Add to `renderWidget` function (full-width):
  ```typescript
  case "resource_heatmap":
    return <ResourceHeatmap key={`resource_heatmap-${refreshKey}`} />;
  ```

**Step 4: Export from barrel**

```typescript
export { ResourceHeatmap } from "./ResourceHeatmap";
```

**Step 5: Commit**

```bash
git add src/lib/dashboard/widgetRegistry.ts src/components/agency/dashboard/DashboardCustomizePanel.tsx src/components/agency/dashboard/index.ts src/app/(admin)/dashboard/page.tsx
git commit -m "feat: integrate resource heatmap into dashboard widget system"
```

---

## Feature 4: Client Journey Map

A visual timeline showing the complete lifecycle of a client relationship with milestones, phase colors, and communication touchpoints.

### Task 10: Create the Client Journey API route

**Files:**
- Create: `src/app/api/clients/[id]/journey/route.ts`

**Step 1: Create the API route**

This route returns the timeline of events for a specific client.

Query these tables for the given `client_id`:
- `clients` — get creation date, status changes
- `invoices` — sent/paid dates per invoice
- `projects` — start dates, completion dates
- `proposals` — sent/accepted dates
- `contracts` — signed dates
- `activity_logs` — all activity for this client (entity_type = 'client', entity_id = client_id, or related entities)
- `payments` — payment dates

Return sorted timeline:
```typescript
{
  client: { id, name, company, status, created_at },
  totalRevenue: number,
  phases: {
    acquisition: { start: string; end: string | null };
    onboarding: { start: string | null; end: string | null };
    active: { start: string | null; end: string | null };
    retention: { start: string | null; end: string | null };
  },
  milestones: {
    id: string;
    type: "lead_created" | "client_created" | "proposal_sent" | "proposal_accepted" | "contract_signed" | "project_started" | "invoice_sent" | "payment_received" | "project_completed" | "milestone";
    title: string;
    date: string; // ISO
    amount?: number; // For financial events
    metadata?: Record<string, unknown>;
  }[];
  cumulativeRevenue: { date: string; total: number }[]; // Running total at each payment
}
```

**Step 2: Commit**

```bash
git add "src/app/api/clients/[id]/journey/route.ts"
git commit -m "feat: add client journey API for lifecycle timeline data"
```

---

### Task 11: Build the Client Journey Map component

**Files:**
- Create: `src/components/agency/dashboard/ClientJourneyMap.tsx`

**Step 1: Build the journey map component**

This is a widget that shows a horizontally scrollable timeline. Since it needs a specific client selected, it has two states:

**State 1 — Client Selector**: Shows a dropdown/search to pick a client. Default shows the most recent or highest-value client.

**State 2 — Journey Timeline**: After selecting a client:

The timeline is a horizontal scrollable container with:

1. **Phase bar** at top: Colored sections spanning the timeline
   - Acquisition (blue-500): From lead/client creation to first proposal
   - Onboarding (purple-500): From proposal acceptance to first project start
   - Active (brand-500/green): First project to present (if active)
   - Retention (amber-500): If client has been active >6 months

2. **Milestone dots** on a horizontal line:
   - Each milestone is a circle on the timeline
   - Icon inside based on type (user for creation, file for proposal, pen for contract, dollar for payment, rocket for project)
   - Hover/click to expand details
   - Connected by a horizontal line

3. **Cumulative revenue line** below: A subtle sparkline showing running total revenue from this client

4. **Summary stats** at bottom: Total Revenue, Duration (months), Projects Count, Invoices Paid

Design:
- Horizontal scroll with `overflow-x-auto` and `scroll-smooth`
- Timeline line: `h-0.5 bg-gray-200 dark:bg-gray-700`
- Milestone dots: `w-8 h-8 rounded-full` with type-specific colors
- Phase bar: `h-2 rounded-full` with gradient
- Uses Framer Motion for milestone pop-in animation

The widget wrapper matches existing style with title "Client Journey" and a map/route icon.

**Step 2: Commit**

```bash
git add src/components/agency/dashboard/ClientJourneyMap.tsx
git commit -m "feat: add client journey map timeline visualization component"
```

---

### Task 12: Register Client Journey widget and integrate into dashboard

**Files:**
- Modify: `src/lib/dashboard/widgetRegistry.ts` — add widget
- Modify: `src/components/agency/dashboard/DashboardCustomizePanel.tsx` — add setting
- Modify: `src/components/agency/dashboard/index.ts` — add export
- Modify: `src/app/(admin)/dashboard/page.tsx` — add rendering

**Step 1: Register widget**

Add to `widgetRegistry`:
```typescript
{ key: "client_journey", label: "Client Journey", column: "full" },
```

Full width because the horizontal timeline needs space.

Add `"client_journey"` to `defaultWidgetOrder` (after "resource_heatmap").

Add to `defaultVisibility`: `client_journey: true`

**Step 2: Update settings**

Add `show_client_journey: boolean` to `DashboardSettings` interface.

Add to `visibilityKeys`: `client_journey: "show_client_journey"`

**Step 3: Update dashboard page**

- Import `ClientJourneyMap`
- Add `show_client_journey: true` to `defaultSettings`
- Add to `isVisible` map
- Add to `renderWidget`:
  ```typescript
  case "client_journey":
    return <ClientJourneyMap key={`client_journey-${refreshKey}`} />;
  ```

**Step 4: Export from barrel**

```typescript
export { ClientJourneyMap } from "./ClientJourneyMap";
```

**Step 5: Commit**

```bash
git add src/lib/dashboard/widgetRegistry.ts src/components/agency/dashboard/DashboardCustomizePanel.tsx src/components/agency/dashboard/index.ts src/app/(admin)/dashboard/page.tsx
git commit -m "feat: integrate client journey map into dashboard widget system"
```

---

### Task 13: Final integration test and polish

**Files:**
- Possibly touch: Any of the above files for fixes

**Step 1: Run the dev server**

Run: `npm run dev`

Navigate to `/dashboard` and verify:
1. Command Center button appears and opens the full-screen view
2. Client Health widget loads in the left column with scores
3. Resource Heatmap loads as a full-width widget with the team grid
4. Client Journey Map loads as a full-width widget with client selector
5. All widgets appear in the Customize panel and can be toggled on/off
6. Dark mode works for all components
7. Animations are smooth
8. Loading states show skeletons
9. Error states show retry buttons

**Step 2: Run build check**

Run: `npm run build`

Fix any TypeScript errors or build issues.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: polish and finalize all 4 WOW dashboard features"
```

---

## Summary of All Files

**New files (8):**
- `src/app/api/dashboard/command-center/route.ts`
- `src/app/api/dashboard/client-health/route.ts`
- `src/app/api/dashboard/resource-heatmap/route.ts`
- `src/app/api/clients/[id]/journey/route.ts`
- `src/components/agency/dashboard/AgencyCommandCenter.tsx`
- `src/components/agency/dashboard/ClientHealthWidget.tsx`
- `src/components/agency/dashboard/ResourceHeatmap.tsx`
- `src/components/agency/dashboard/ClientJourneyMap.tsx`

**Modified files (4):**
- `src/lib/dashboard/widgetRegistry.ts`
- `src/components/agency/dashboard/DashboardCustomizePanel.tsx`
- `src/components/agency/dashboard/index.ts`
- `src/app/(admin)/dashboard/page.tsx`
