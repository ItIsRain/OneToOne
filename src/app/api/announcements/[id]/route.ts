import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import { validateBody, updateAnnouncementSchema } from "@/lib/validations";
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

// GET - Fetch a single announcement
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

    const { data: announcement, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Fetch announcement error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Increment views count
    await supabase
      .from("announcements")
      .update({ views_count: (announcement.views_count || 0) + 1 })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Get announcement error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update an announcement
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
    const validation = validateBody(updateAnnouncementSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get existing announcement to handle image updates
    const { data: existing } = await supabase
      .from("announcements")
      .select("image_public_id, attachments")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: userId,
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) {
      updateData.content = body.content;
      if (!body.excerpt) {
        updateData.excerpt = body.content.substring(0, 150);
      }
    }
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;
    if (body.publish_at !== undefined) updateData.publish_at = body.publish_at;
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at;
    if (body.target_roles !== undefined) updateData.target_roles = body.target_roles;
    if (body.target_users !== undefined) updateData.target_users = body.target_users;

    // Handle new image upload
    if (body.image) {
      try {
        // Delete old image if exists
        if (existing?.image_public_id) {
          await cloudinary.uploader.destroy(existing.image_public_id);
        }

        const uploadResult = await cloudinary.uploader.upload(body.image, {
          folder: `announcements/${profile.tenant_id}`,
          resource_type: "image",
        });
        updateData.image_url = uploadResult.secure_url;
        updateData.image_public_id = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
      }
    }

    // Handle image removal
    if (body.remove_image && existing?.image_public_id) {
      try {
        await cloudinary.uploader.destroy(existing.image_public_id);
        updateData.image_url = null;
        updateData.image_public_id = null;
      } catch (deleteError) {
        console.error("Cloudinary delete error:", deleteError);
      }
    }

    // Handle reactions update (increment/decrement)
    if (body.add_reaction) {
      const { data: current } = await supabase
        .from("announcements")
        .select("reactions")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      const reactions = current?.reactions || {};
      reactions[body.add_reaction] = (reactions[body.add_reaction] || 0) + 1;
      updateData.reactions = reactions;
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update announcement error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Update announcement error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete an announcement
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

    // Get announcement to clean up Cloudinary assets
    const { data: announcement } = await supabase
      .from("announcements")
      .select("image_public_id, attachments, title, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Delete from database
    const { error } = await supabase.from("announcements").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete announcement error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up Cloudinary assets
    try {
      if (announcement.image_public_id) {
        await cloudinary.uploader.destroy(announcement.image_public_id);
      }
      if (announcement.attachments && Array.isArray(announcement.attachments)) {
        for (const attachment of announcement.attachments) {
          if (attachment.public_id) {
            await cloudinary.uploader.destroy(attachment.public_id, {
              resource_type: attachment.type || "raw",
            });
          }
        }
      }
    } catch (cleanupError) {
      console.error("Cloudinary cleanup error:", cleanupError);
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: announcement.tenant_id,
      user_id: userId,
      action: "deleted",
      entity_type: "announcement",
      entity_id: id,
      entity_name: announcement.title,
      description: `Deleted announcement: ${announcement.title}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
