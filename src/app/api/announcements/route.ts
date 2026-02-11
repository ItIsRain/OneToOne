import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { validateBody, createAnnouncementSchema } from "@/lib/validations";
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

// GET - Fetch announcements
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "10");
    const includeUnpublished = searchParams.get("include_unpublished") === "true";
    const category = searchParams.get("category");

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
      .from("announcements")
      .select("id, created_at, updated_at, title, excerpt, content, category, is_pinned, is_published, image_url, attachments, publish_at, expires_at, created_by")
      .eq("tenant_id", profile.tenant_id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!includeUnpublished) {
      query = query
        .eq("is_published", true)
        .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error("Fetch announcements error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcements: announcements || [] });
  } catch (error) {
    console.error("Get announcements error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create announcement
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

    // Validate input
    const validation = validateBody(createAnnouncementSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Handle image upload if provided
    let imageUrl = null;
    let imagePublicId = null;
    if (body.image) {
      try {
        const uploadResult = await cloudinary.uploader.upload(body.image, {
          folder: `announcements/${profile.tenant_id}`,
          resource_type: "image",
        });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    // Handle attachments
    const attachments = [];
    if (body.attachments && Array.isArray(body.attachments)) {
      for (const attachment of body.attachments) {
        if (attachment.file) {
          try {
            const uploadResult = await cloudinary.uploader.upload(attachment.file, {
              folder: `announcements/${profile.tenant_id}/attachments`,
              resource_type: "auto",
            });
            attachments.push({
              name: attachment.name,
              url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              type: uploadResult.resource_type,
              size: uploadResult.bytes,
            });
          } catch (attachError) {
            console.error("Attachment upload error:", attachError);
          }
        }
      }
    }

    const announcementData = {
      tenant_id: profile.tenant_id,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || body.content.substring(0, 150),
      image_url: imageUrl,
      image_public_id: imagePublicId,
      attachments,
      category: body.category || "general",
      priority: body.priority || "normal",
      is_pinned: body.is_pinned || false,
      is_published: body.is_published !== false,
      publish_at: body.publish_at || null,
      expires_at: body.expires_at || null,
      target_roles: body.target_roles || [],
      target_users: body.target_users || [],
      created_by: userId,
      updated_by: userId,
    };

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert(announcementData)
      .select()
      .single();

    if (error) {
      console.error("Insert announcement error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: userId,
      action: "created",
      entity_type: "announcement",
      entity_id: announcement.id,
      entity_name: announcement.title,
      description: `Created announcement: ${announcement.title}`,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
