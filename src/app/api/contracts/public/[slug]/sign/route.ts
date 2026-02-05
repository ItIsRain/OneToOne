import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// POST - Submit eSignature for contract (NO AUTH)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 5 sign attempts per IP per minute
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "contract-sign",
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    const body = await request.json();

    const { signature_name, signature_data } = body;

    if (!signature_name || !signature_data) {
      return NextResponse.json(
        { error: "Signature name and data are required" },
        { status: 400 }
      );
    }

    // Validate signature inputs
    if (typeof signature_name !== "string" || signature_name.length > 200) {
      return NextResponse.json(
        { error: "Signature name must be a string under 200 characters" },
        { status: 400 }
      );
    }

    if (typeof signature_data !== "string" || signature_data.length > 200000) {
      return NextResponse.json(
        { error: "Signature data is too large" },
        { status: 400 }
      );
    }

    // Validate signature_data is a valid data URI (base64 image)
    if (!signature_data.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Signature data must be a valid image data URI" },
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
      .select("id, status, tenant_id, name, client_id, value")
      .eq("slug", slug)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.status === "signed") {
      return NextResponse.json({ error: "Contract already signed" }, { status: 400 });
    }

    if (contract.status === "declined") {
      return NextResponse.json({ error: "Contract was declined" }, { status: 400 });
    }

    if (contract.status === "terminated" || contract.status === "expired") {
      return NextResponse.json({ error: `Contract is ${contract.status}` }, { status: 400 });
    }

    // Reuse IP from rate limit check above

    // Update contract with signature
    const { error: updateError } = await serviceClient
      .from("contracts")
      .update({
        status: "signed",
        is_signed: true,
        signatory_name: signature_name,
        signature_ip: ip,
        signed_date: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { signature_data },
      })
      .eq("id", contract.id);

    if (updateError) {
      console.error("Sign error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Trigger workflow automations for contract_signed
    if (contract.tenant_id) {
      try {
        await checkTriggers("contract_signed", {
          entity_id: contract.id,
          entity_type: "contract",
          entity_name: contract.name,
          contract_title: contract.name,
          client_id: contract.client_id,
          total: contract.value || 0,
          signature_name,
        }, serviceClient, contract.tenant_id, "system");
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
