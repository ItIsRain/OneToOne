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

// GET - Fetch a single proposal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`
        *,
        client:clients(id, name, company, email),
        lead:leads(id, name, company),
        project:projects(id, name, project_code)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Get proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PUT - Update a proposal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "title",
      "slug",
      "status",
      "sections",
      "pricing_items",
      "subtotal",
      "discount_percent",
      "tax_percent",
      "total",
      "currency",
      "valid_until",
      "notes",
      "agency_signature_data",
      "agency_signature_name",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: proposal, error } = await supabase
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        client:clients(id, name, company, email),
        lead:leads(id, name, company),
        project:projects(id, name, project_code)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Update proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a proposal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
