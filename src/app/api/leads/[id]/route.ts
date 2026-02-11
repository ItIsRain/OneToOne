import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, updateLeadSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch a single lead
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

    const { data: lead, error } = await supabase
      .from("leads")
      .select(`
        *,
        assigned_to_profile:profiles!leads_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Get lead error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a lead
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Validate input
    const validation = validateBody(updateLeadSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate FK references belong to the same tenant
    if (body.assigned_to) {
      const { data: assignee } = await supabase
        .from("profiles").select("id").eq("id", body.assigned_to).eq("tenant_id", profile.tenant_id).single();
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found in your organization" }, { status: 404 });
      }
    }
    if (body.converted_to_client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", body.converted_to_client_id).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Fetch old lead for status change trigger
    const { data: oldLead } = await supabase
      .from("leads")
      .select("status, tenant_id, name")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "job_title",
      "website",
      "address",
      "city",
      "country",
      "status",
      "estimated_value",
      "probability",
      "priority",
      "score",
      "source",
      "campaign",
      "referral_source",
      "industry",
      "company_size",
      "budget_range",
      "next_follow_up",
      "last_contacted",
      "expected_close_date",
      "actual_close_date",
      "assigned_to",
      "notes",
      "requirements",
      "pain_points",
      "competitor_info",
      "lost_reason",
      "tags",
      "services_interested",
      "converted_to_client_id",
      "conversion_date",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: lead, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        assigned_to_profile:profiles!leads_assigned_to_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for lead_status_changed
    if (body.status && oldLead && body.status !== oldLead.status && oldLead.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("lead_status_changed", {
            entity_id: id,
            entity_type: "lead",
            entity_name: lead.name || oldLead.name,
            lead_name: lead.name || oldLead.name,
            from_status: oldLead.status,
            to_status: body.status,
            lead_email: lead.email,
            lead_company: lead.company,
          }, serviceClient, oldLead.tenant_id, userId);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lead error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
