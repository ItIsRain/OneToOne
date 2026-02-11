import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// Parse CLOUDINARY_URL
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  const matches = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (matches) {
    cloudinary.config({
      cloud_name: matches[3],
      api_key: matches[1],
      api_secret: matches[2],
    });
  }
}

// GET - Fetch all contracts for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const status = searchParams.get("status");
    const contractType = searchParams.get("contract_type");
    const clientId = searchParams.get("client_id");
    const projectId = searchParams.get("project_id");
    const search = searchParams.get("search");
    const expiringSoon = searchParams.get("expiring_soon");

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from("contracts")
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (contractType) {
      query = query.eq("contract_type", contractType);
    }

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,contract_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (expiringSoon === "true") {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query
        .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gte("end_date", new Date().toISOString().split("T")[0])
        .in("status", ["active"]);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error("Fetch contracts error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allContractsQuery = await supabase
      .from("contracts")
      .select("status, value, end_date")
      .eq("tenant_id", profile.tenant_id);

    const allContracts = allContractsQuery.data || [];
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: allContracts.length,
      by_status: {
        draft: allContracts.filter((c) => c.status === "draft").length,
        pending_signature: allContracts.filter((c) => c.status === "pending_signature").length,
        active: allContracts.filter((c) => c.status === "active").length,
        expired: allContracts.filter((c) => c.status === "expired").length,
        terminated: allContracts.filter((c) => c.status === "terminated").length,
      },
      total_value: allContracts
        .filter((c) => c.status === "active")
        .reduce((sum, c) => sum + (c.value || 0), 0),
      expiring_soon: allContracts.filter(
        (c) =>
          c.status === "active" &&
          c.end_date &&
          new Date(c.end_date) >= now &&
          new Date(c.end_date) <= thirtyDaysFromNow
      ).length,
    };

    return NextResponse.json({ contracts, stats });
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create a new contract
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Contract name is required" }, { status: 400 });
    }

    // Generate contract number
    const { data: contractNumber } = await supabase.rpc("generate_contract_number", {
      p_tenant_id: profile.tenant_id,
    });

    // Handle document upload if provided
    let documentUrl = null;
    let documentPublicId = null;
    if (body.document) {
      try {
        const uploadResult = await cloudinary.uploader.upload(body.document, {
          folder: `contracts/${profile.tenant_id}`,
          resource_type: "auto",
          public_id: `${crypto.randomUUID().substring(0, 12)}_${body.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
        });
        documentUrl = uploadResult.secure_url;
        documentPublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    const contractData = {
      tenant_id: profile.tenant_id,
      contract_number: contractNumber,
      name: body.name,
      contract_type: body.contract_type || "service_agreement",
      category: body.category || null,
      client_id: body.client_id || null,
      project_id: body.project_id || null,
      value: body.value || null,
      currency: body.currency || "USD",
      payment_terms: body.payment_terms || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      auto_renew: body.auto_renew || false,
      renewal_period: body.renewal_period || null,
      renewal_notice_days: body.renewal_notice_days || 30,
      status: body.status || "draft",
      document_url: documentUrl,
      document_public_id: documentPublicId,
      document_file_id: body.document_file_id || null,
      signature_required: body.signature_required !== false,
      signatory_name: body.signatory_name || null,
      signatory_email: body.signatory_email || null,
      signatory_title: body.signatory_title || null,
      description: body.description || null,
      terms_and_conditions: body.terms_and_conditions || null,
      special_clauses: body.special_clauses || null,
      parties: body.parties || [],
      deliverables: body.deliverables || [],
      milestones: body.milestones || [],
      tags: body.tags || [],
      internal_notes: body.internal_notes || null,
      reminder_enabled: body.reminder_enabled !== false,
      reminder_days_before: body.reminder_days_before || 30,
      metadata: body.metadata || {},
      created_by: userId,
      updated_by: userId,
    };

    const { data: contract, error } = await supabase
      .from("contracts")
      .insert(contractData)
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code)
      `)
      .single();

    if (error) {
      console.error("Insert contract error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("contract_activities").insert({
      tenant_id: profile.tenant_id,
      contract_id: contract.id,
      action: "created",
      description: `Contract "${contract.name}" was created`,
      performed_by: userId,
    });

    // Also log to activity_logs
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: userId,
      action: "created",
      entity_type: "contract",
      entity_id: contract.id,
      entity_name: contract.name,
      description: `Created contract: ${contract.name}`,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Create contract error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
