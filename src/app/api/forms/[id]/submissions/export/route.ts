import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
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

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET - Export submissions as CSV
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Check plan feature access for forms
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const formsAccess = checkFeatureAccess(planInfo.planType, "forms");
    if (!formsAccess.allowed) {
      return NextResponse.json(
        {
          error: formsAccess.reason,
          upgrade_required: formsAccess.upgrade_required,
          feature: "forms",
        },
        { status: 403 }
      );
    }

    // Fetch the form to get field definitions
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, title, fields")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Fetch submissions
    const { data: submissions, error } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("form_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV headers from form fields
    const fields = (form.fields || []) as Array<{ id: string; label: string }>;
    const headers = [
      "Submission ID",
      "Submitted At",
      ...fields.map((f) => f.label || f.id),
    ];

    // Build CSV rows
    const rows = (submissions || []).map((sub) => {
      const data = (sub.data || {}) as Record<string, unknown>;
      return [
        sub.id,
        sub.created_at,
        ...fields.map((f) => escapeCsvValue(data[f.id])),
      ].map(escapeCsvValue);
    });

    const csv = [headers.map(escapeCsvValue).join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_submissions.csv"`,
      },
    });
  } catch (error) {
    console.error("Export submissions error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
