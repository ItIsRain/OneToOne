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

// POST - Duplicate a contract
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

    // Fetch original contract
    const { data: original, error: fetchError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Generate new slug with -copy and random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${original.slug}-copy-${randomSuffix}`;

    const duplicateData = {
      tenant_id: original.tenant_id,
      created_by: user.id,
      name: `${original.name} (Copy)`,
      slug: newSlug,
      client_id: original.client_id,
      project_id: original.project_id,
      proposal_id: original.proposal_id,
      sections: original.sections || [],
      contract_type: original.contract_type,
      value: original.value,
      currency: original.currency,
      terms_and_conditions: original.terms_and_conditions,
      payment_terms: original.payment_terms,
      internal_notes: original.internal_notes,
      status: "draft",
      // Clear all signature and date fields
      is_signed: false,
      signatory_name: null,
      signatory_email: null,
      signature_ip: null,
      signed_date: null,
      counter_signed: false,
      counter_signatory_name: null,
      counter_signed_date: null,
      sent_at: null,
      viewed_at: null,
      accepted_at: null,
    };

    const { data: contract, error } = await supabase
      .from("contracts")
      .insert(duplicateData)
      .select('*, client:clients(id, name, company, email)')
      .single();

    if (error) {
      console.error("Duplicate error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Duplicate contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
