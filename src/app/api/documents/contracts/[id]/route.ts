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

// GET - Fetch a single contract by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(id, name, email, company, phone),
        project:projects(id, name, project_code, status),
        document_file:files(id, name, file_url, file_type, file_size)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Fetch contract error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from("contract_activities")
      .select("*")
      .eq("contract_id", id)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ contract, activities: activities || [] });
  } catch (error) {
    console.error("Get contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a contract
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

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

    // Get existing contract for comparison
    const { data: existing } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_by: userId,
    };

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.contract_type !== undefined) updateData.contract_type = body.contract_type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.client_id !== undefined) updateData.client_id = body.client_id || null;
    if (body.project_id !== undefined) updateData.project_id = body.project_id || null;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.payment_terms !== undefined) updateData.payment_terms = body.payment_terms;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.status !== undefined) updateData.status = body.status;

    // Renewal fields
    if (body.auto_renew !== undefined) updateData.auto_renew = body.auto_renew;
    if (body.renewal_period !== undefined) updateData.renewal_period = body.renewal_period;
    if (body.renewal_notice_days !== undefined) updateData.renewal_notice_days = body.renewal_notice_days;
    if (body.next_renewal_date !== undefined) updateData.next_renewal_date = body.next_renewal_date;

    // Signature fields
    if (body.signature_required !== undefined) updateData.signature_required = body.signature_required;
    if (body.signatory_name !== undefined) updateData.signatory_name = body.signatory_name;
    if (body.signatory_email !== undefined) updateData.signatory_email = body.signatory_email;
    if (body.signatory_title !== undefined) updateData.signatory_title = body.signatory_title;

    // Content fields
    if (body.description !== undefined) updateData.description = body.description;
    if (body.terms_and_conditions !== undefined) updateData.terms_and_conditions = body.terms_and_conditions;
    if (body.special_clauses !== undefined) updateData.special_clauses = body.special_clauses;

    // Array fields
    if (body.parties !== undefined) updateData.parties = body.parties;
    if (body.deliverables !== undefined) updateData.deliverables = body.deliverables;
    if (body.milestones !== undefined) updateData.milestones = body.milestones;
    if (body.tags !== undefined) updateData.tags = body.tags;

    // Notes and reminders
    if (body.internal_notes !== undefined) updateData.internal_notes = body.internal_notes;
    if (body.reminder_enabled !== undefined) updateData.reminder_enabled = body.reminder_enabled;
    if (body.reminder_days_before !== undefined) updateData.reminder_days_before = body.reminder_days_before;

    // Document file
    if (body.document_file_id !== undefined) updateData.document_file_id = body.document_file_id;

    // Handle new document upload
    if (body.document) {
      try {
        // Delete old document if exists
        if (existing.document_public_id) {
          await cloudinary.uploader.destroy(existing.document_public_id, {
            resource_type: "raw",
          });
        }

        const uploadResult = await cloudinary.uploader.upload(body.document, {
          folder: `contracts/${profile.tenant_id}`,
          resource_type: "auto",
          public_id: `${crypto.randomUUID().substring(0, 12)}_${existing.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
        });
        updateData.document_url = uploadResult.secure_url;
        updateData.document_public_id = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    // Handle signing
    if (body.sign === true && !existing.is_signed) {
      updateData.is_signed = true;
      updateData.signed_date = new Date().toISOString();
      updateData.signed_by = userId;
      updateData.signature_ip = body.signature_ip || null;
      if (existing.status === "pending_signature") {
        updateData.status = "active";
      }
    }

    // Handle counter-signing
    if (body.counter_sign === true && !existing.counter_signed) {
      updateData.counter_signed = true;
      updateData.counter_signed_date = new Date().toISOString();
      updateData.counter_signed_by = userId;
      updateData.counter_signatory_name = body.counter_signatory_name || null;
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name, project_code)
      `)
      .single();

    if (error) {
      console.error("Update contract error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine action for activity log
    let action = "updated";
    let description = `Contract "${contract.name}" was updated`;

    if (body.sign === true) {
      action = "signed";
      description = `Contract "${contract.name}" was signed`;
    } else if (body.counter_sign === true) {
      action = "counter_signed";
      description = `Contract "${contract.name}" was counter-signed`;
    } else if (body.status && body.status !== existing.status) {
      action = "status_changed";
      description = `Contract status changed from "${existing.status}" to "${body.status}"`;
    }

    // Log activity
    await supabase.from("contract_activities").insert({
      tenant_id: profile.tenant_id,
      contract_id: id,
      action,
      description,
      changes: { status: { old: existing.status, new: contract.status } },
      performed_by: userId,
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Update contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a contract
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { id } = await params;

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get contract for cleanup and activity log
    const { data: contract } = await supabase
      .from("contracts")
      .select("name, document_public_id, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Delete from database
    const { error } = await supabase.from("contracts").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete contract error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up Cloudinary document
    if (contract.document_public_id) {
      try {
        await cloudinary.uploader.destroy(contract.document_public_id, {
          resource_type: "raw",
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: contract.tenant_id,
      user_id: userId,
      action: "deleted",
      entity_type: "contract",
      entity_id: id,
      entity_name: contract.name,
      description: `Deleted contract: ${contract.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
