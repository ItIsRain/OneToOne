import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

// GET - Fetch a single template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
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

    const { data: template, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Fetch template error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a template
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { id } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Get existing template
    const { data: existing } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_by: userId,
    };

    // Handle "use" action - increment use count
    if (body.action === "use") {
      updateData.use_count = (existing.use_count || 0) + 1;
      updateData.last_used_at = new Date().toISOString();

      const { data: template, error } = await supabase
        .from("document_templates")
        .update(updateData)
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ template });
    }

    // Regular update fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;
    if (body.variables !== undefined) updateData.variables = body.variables;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (body.allowed_roles !== undefined) updateData.allowed_roles = body.allowed_roles;

    // Handle new file upload (new version)
    if (body.file) {
      try {
        // Save old version to history
        const versionHistory = existing.version_history || [];
        versionHistory.push({
          version: existing.version,
          file_url: existing.file_url,
          updated_at: existing.updated_at,
          updated_by: existing.updated_by,
        });

        // Upload new file
        const uploadResult = await cloudinary.uploader.upload(body.file, {
          folder: `templates/${profile.tenant_id}`,
          resource_type: "raw",
          public_id: `${crypto.randomUUID().substring(0, 12)}_${(body.name || existing.name).replace(/[^a-zA-Z0-9]/g, "_")}_v${existing.version + 1}`,
        });

        // Extract file info
        const mimeMatch = body.file.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const base64Data = body.file.replace(/^data:[^;]+;base64,/, "");
        const fileSize = Buffer.from(base64Data, "base64").length;
        const extension = body.file_name?.split(".").pop()?.toLowerCase() || existing.file_extension;

        updateData.file_url = uploadResult.secure_url;
        updateData.cloudinary_public_id = uploadResult.public_id;
        updateData.mime_type = mimeType;
        updateData.file_size = fileSize;
        updateData.file_extension = extension;
        updateData.version = existing.version + 1;
        updateData.version_history = versionHistory;

        // Delete old file from Cloudinary
        if (existing.cloudinary_public_id) {
          try {
            await cloudinary.uploader.destroy(existing.cloudinary_public_id, {
              resource_type: "raw",
            });
          } catch {
            // Ignore cleanup errors
          }
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload new file" }, { status: 500 });
      }
    }

    const { data: template, error } = await supabase
      .from("document_templates")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update template error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
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

    // Get template for cleanup
    const { data: template } = await supabase
      .from("document_templates")
      .select("cloudinary_public_id, name")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete from database
    const { error } = await supabase.from("document_templates").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete template error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up Cloudinary
    if (template.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(template.cloudinary_public_id, {
          resource_type: "raw",
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
