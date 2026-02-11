import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createBookmarkSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch user's bookmarks
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entity_type");
    const folder = searchParams.get("folder");

    // Build query
    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (folder) {
      query = query.eq("folder", folder);
    }

    const { data: bookmarks, error } = await query;

    if (error) {
      console.error("Fetch bookmarks error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks || [] });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create bookmark
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
    const validation = validateBody(createBookmarkSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if bookmark already exists
    if (body.entity_id) {
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("entity_type", body.entity_type)
        .eq("entity_id", body.entity_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Bookmark already exists" },
          { status: 409 }
        );
      }
    }

    const bookmarkData = {
      tenant_id: profile.tenant_id,
      user_id: userId,
      entity_type: body.entity_type,
      entity_id: body.entity_id || null,
      entity_name: body.entity_name,
      url: body.url || null,
      icon: body.icon || null,
      color: body.color || null,
      folder: body.folder || null,
      sort_order: body.sort_order || 0,
      notes: body.notes || null,
    };

    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .insert(bookmarkData)
      .select()
      .single();

    if (error) {
      console.error("Insert bookmark error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    console.error("Create bookmark error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
