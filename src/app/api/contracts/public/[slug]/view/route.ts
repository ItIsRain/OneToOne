import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// POST - Track client view of contract (NO AUTH)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Only update if status is "sent" (first view)
    // Include tenant_id in select to validate cross-tenant access
    const { data: contract } = await serviceClient
      .from("contracts")
      .select("id, status, tenant_id")
      .eq("slug", slug)
      .single();

    // If accessed from within platform (has tenant header), validate tenant matches
    // This prevents cross-tenant access from within the platform
    if (tenantId && contract && contract.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.status === "sent") {
      await serviceClient
        .from("contracts")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track view error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
