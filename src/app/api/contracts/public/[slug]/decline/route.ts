import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST - Client decline contract (NO AUTH)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    // Rate limit: 5 decline attempts per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "contract-decline",
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const body = await request.json();
    const { reason, decliner_name } = body;

    // Require a reason to ensure intentional action
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A decline reason is required (minimum 5 characters)" },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { error: "Decline reason must be under 1000 characters" },
        { status: 400 }
      );
    }

    // Validate decliner_name if provided
    if (decliner_name && (typeof decliner_name !== "string" || decliner_name.length > 200)) {
      return NextResponse.json(
        { error: "Decliner name must be a string under 200 characters" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract
    const { data: contract, error: fetchError } = await serviceClient
      .from("contracts")
      .select("id, status, tenant_id")
      .eq("slug", slug)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // If accessed from within platform (has tenant header), validate tenant matches
    // This prevents cross-tenant contract actions from within the platform
    if (tenantId && contract.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.status === "signed") {
      return NextResponse.json({ error: "Contract already signed" }, { status: 400 });
    }

    if (contract.status === "declined") {
      return NextResponse.json({ error: "Contract already declined" }, { status: 400 });
    }

    if (contract.status === "terminated" || contract.status === "expired") {
      return NextResponse.json({ error: `Contract is ${contract.status}` }, { status: 400 });
    }

    const { error: updateError } = await serviceClient
      .from("contracts")
      .update({
        status: "declined",
        declined_reason: reason.trim(),
        declined_by: decliner_name?.trim() || null,
        declined_at: new Date().toISOString(),
        declined_ip: ip,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contract.id);

    if (updateError) {
      console.error("Decline error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decline contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
