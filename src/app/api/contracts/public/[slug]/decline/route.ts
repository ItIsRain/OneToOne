import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST - Client decline contract (NO AUTH)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract
    const { data: contract, error: fetchError } = await serviceClient
      .from("contracts")
      .select("id, status")
      .eq("slug", slug)
      .single();

    if (fetchError || !contract) {
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
