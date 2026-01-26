import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// PATCH - Update a bookmark
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.entity_name !== undefined) updateData.entity_name = body.entity_name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.folder !== undefined) updateData.folder = body.folder;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update bookmark error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("Update bookmark error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a bookmark
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete bookmark error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bookmark error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
