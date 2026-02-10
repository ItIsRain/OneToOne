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
            // Server component context
          }
        },
      },
    }
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;
    const searchPattern = `%${query}%`;

    // Run searches in parallel across entity tables
    const [clients, leads, projects, tasks, events, invoices, proposals, contracts] =
      await Promise.all([
        supabase
          .from("clients")
          .select("id, name, company, email")
          .eq("tenant_id", tenantId)
          .or(`name.ilike.${searchPattern},company.ilike.${searchPattern},email.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("leads")
          .select("id, name, company, email")
          .eq("tenant_id", tenantId)
          .or(`name.ilike.${searchPattern},company.ilike.${searchPattern},email.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("projects")
          .select("id, name, status")
          .eq("tenant_id", tenantId)
          .ilike("name", searchPattern)
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, status, project_id")
          .eq("tenant_id", tenantId)
          .ilike("title", searchPattern)
          .limit(5),
        supabase
          .from("events")
          .select("id, title, event_type, start_date")
          .eq("tenant_id", tenantId)
          .ilike("title", searchPattern)
          .limit(5),
        supabase
          .from("invoices")
          .select("id, title, invoice_number, status")
          .eq("tenant_id", tenantId)
          .or(`title.ilike.${searchPattern},invoice_number.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from("proposals")
          .select("id, title, status")
          .eq("tenant_id", tenantId)
          .ilike("title", searchPattern)
          .limit(5),
        supabase
          .from("contracts")
          .select("id, title, status")
          .eq("tenant_id", tenantId)
          .ilike("title", searchPattern)
          .limit(5),
      ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: { type: string; id: string; title: string; subtitle?: string; path: string }[] = [];

    (clients.data || []).forEach((c) =>
      results.push({ type: "client", id: c.id, title: c.name, subtitle: c.company || c.email, path: `/dashboard/crm/clients/${c.id}` })
    );
    (leads.data || []).forEach((l) =>
      results.push({ type: "lead", id: l.id, title: l.name, subtitle: l.company || l.email, path: `/dashboard/crm/leads/${l.id}` })
    );
    (projects.data || []).forEach((p) =>
      results.push({ type: "project", id: p.id, title: p.name, subtitle: p.status, path: `/dashboard/projects/${p.id}` })
    );
    (tasks.data || []).forEach((t) =>
      results.push({ type: "task", id: t.id, title: t.title, subtitle: t.status, path: `/dashboard/projects/tasks/${t.id}` })
    );
    (events.data || []).forEach((e) =>
      results.push({ type: "event", id: e.id, title: e.title, subtitle: e.event_type, path: `/dashboard/events/${e.id}` })
    );
    (invoices.data || []).forEach((i) =>
      results.push({ type: "invoice", id: i.id, title: i.title || i.invoice_number, subtitle: i.status, path: `/dashboard/finance/invoices/${i.id}` })
    );
    (proposals.data || []).forEach((p) =>
      results.push({ type: "proposal", id: p.id, title: p.title, subtitle: p.status, path: `/dashboard/proposals/${p.id}` })
    );
    (contracts.data || []).forEach((c) =>
      results.push({ type: "contract", id: c.id, title: c.title, subtitle: c.status, path: `/dashboard/contracts/${c.id}` })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
