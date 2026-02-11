import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, updateVendorSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch a single vendor
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

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Get vendor error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a vendor
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
    const validation = validateBody(updateVendorSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Fetch old vendor for status change trigger
    const { data: oldVendor } = await supabase
      .from("vendors")
      .select("status, tenant_id, name")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "company",
      "email",
      "phone",
      "category",
      "services",
      "hourly_rate",
      "rating",
      "status",
      "notes",
      "website",
      "address",
      "city",
      "country",
      "tags",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Use nullish coalescing for numeric fields to preserve 0 values
        if (key === "hourly_rate" || key === "rating") {
          updates[key] = body[key] ?? null;
        } else {
          updates[key] = body[key];
        }
      }
    }

    // If category name is updated, also update category_id FK
    if (body.category !== undefined) {
      if (body.category) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const svcClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        const { data: catRecord } = await svcClient
          .from("vendor_categories")
          .select("id")
          .eq("tenant_id", profile.tenant_id)
          .eq("name", body.category)
          .single();
        updates.category_id = catRecord?.id || null;
      } else {
        updates.category_id = null;
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for vendor_status_changed
    if (body.status && oldVendor && body.status !== oldVendor.status && oldVendor.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("vendor_status_changed", {
            entity_id: id,
            entity_type: "vendor",
            entity_name: vendor.name || oldVendor.name,
            vendor_name: vendor.name || oldVendor.name,
            from_status: oldVendor.status,
            to_status: body.status,
            vendor_email: vendor.email,
            vendor_company: vendor.company,
          }, serviceClient, oldVendor.tenant_id, userId);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Update vendor error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a vendor
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
      .from("vendors")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
