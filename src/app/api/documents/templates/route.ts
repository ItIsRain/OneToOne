import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { getUserPlanInfo, checkDocumentTemplateLimit } from "@/lib/plan-limits";
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

// Helper to determine file type category
function getFileTypeCategory(mimeType: string, extension: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    extension === "xlsx" ||
    extension === "xls" ||
    extension === "csv"
  )
    return "spreadsheet";
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    extension === "doc" ||
    extension === "docx"
  )
    return "document";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    extension === "ppt" ||
    extension === "pptx"
  )
    return "presentation";
  if (mimeType.startsWith("image/")) return "image";
  return "other";
}

// GET - Fetch all templates
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActive = searchParams.get("is_active");

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    let query = supabase
      .from("document_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("use_count", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Fetch templates error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allTemplatesQuery = await supabase
      .from("document_templates")
      .select("category, use_count, is_active")
      .eq("tenant_id", profile.tenant_id);

    const allTemplates = allTemplatesQuery.data || [];
    const stats = {
      total: allTemplates.length,
      active: allTemplates.filter((t) => t.is_active).length,
      total_uses: allTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0),
      by_category: {
        contracts: allTemplates.filter((t) => t.category === "contracts").length,
        proposals: allTemplates.filter((t) => t.category === "proposals").length,
        finance: allTemplates.filter((t) => t.category === "finance").length,
        events: allTemplates.filter((t) => t.category === "events").length,
        reports: allTemplates.filter((t) => t.category === "reports").length,
        hr: allTemplates.filter((t) => t.category === "hr").length,
        marketing: allTemplates.filter((t) => t.category === "marketing").length,
        general: allTemplates.filter((t) => t.category === "general").length,
      },
    };

    return NextResponse.json({ templates, stats });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new template
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan limits for document templates
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const templateLimitCheck = await checkDocumentTemplateLimit(supabase, profile.tenant_id, planInfo.planType);
    if (!templateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: templateLimitCheck.reason,
          current: templateLimitCheck.current,
          limit: templateLimitCheck.limit,
          upgrade_required: templateLimitCheck.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    if (!body.file) {
      return NextResponse.json({ error: "Template file is required" }, { status: 400 });
    }

    // Extract file info
    const mimeMatch = body.file.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const base64Data = body.file.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");
    const fileSize = fileBuffer.length;

    // Validate file size (25MB limit for templates)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 25MB limit" },
        { status: 400 }
      );
    }

    const extension = body.file_name?.split(".").pop()?.toLowerCase() || "";
    const fileType = getFileTypeCategory(mimeType, extension);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(body.file, {
      folder: `templates/${profile.tenant_id}`,
      resource_type: "raw",
      public_id: `${crypto.randomUUID().substring(0, 12)}_${body.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
    });

    const templateData = {
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description || null,
      category: body.category || "general",
      file_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      file_type: fileType,
      mime_type: mimeType,
      file_size: fileSize,
      file_extension: extension,
      is_active: body.is_active !== false,
      is_default: body.is_default || false,
      variables: body.variables || [],
      tags: body.tags || [],
      is_public: body.is_public !== false,
      allowed_roles: body.allowed_roles || [],
      created_by: userId,
      updated_by: userId,
    };

    const { data: template, error } = await supabase
      .from("document_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error("Insert template error:", error);
      // Cleanup Cloudinary on failure
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: "raw",
        });
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
