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

// POST - Duplicate a proposal
export async function POST(
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

    // Fetch original proposal
    const { data: original, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Generate new slug with -copy and random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${original.slug}-copy-${randomSuffix}`;

    const duplicateData = {
      tenant_id: original.tenant_id,
      created_by: user.id,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      client_id: original.client_id,
      lead_id: original.lead_id,
      project_id: original.project_id,
      sections: original.sections || [],
      pricing_items: original.pricing_items || [],
      subtotal: original.subtotal,
      discount_percent: original.discount_percent,
      tax_percent: original.tax_percent,
      total: original.total,
      currency: original.currency,
      notes: original.notes,
      status: "draft",
      // Clear all signature and date fields
      agency_signature_data: null,
      agency_signature_name: null,
      client_signature_data: null,
      client_signature_name: null,
      client_signature_ip: null,
      client_signed_at: null,
      sent_at: null,
      viewed_at: null,
      accepted_at: null,
      declined_at: null,
      decline_reason: null,
    };

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert(duplicateData)
      .select('*, client:clients(id, name, company, email)')
      .single();

    if (error) {
      console.error("Duplicate error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Duplicate proposal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
