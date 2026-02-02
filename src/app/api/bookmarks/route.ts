import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, createBookmarkSchema } from "@/lib/validations";

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

// GET - Fetch user's bookmarks
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get("entity_type");
    const folder = searchParams.get("folder");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
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
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
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
        .eq("user_id", user.id)
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
      user_id: user.id,
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
