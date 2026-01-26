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

// GET - Fetch a single folder by ID
export async function GET(
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

    const { data: folder, error } = await supabase
      .from("folders")
      .select(`*`)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fetch folder error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Get folder contents count
    const [filesCount, subFoldersCount] = await Promise.all([
      supabase
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("folder_id", id),
      supabase
        .from("folders")
        .select("id", { count: "exact", head: true })
        .eq("parent_folder_id", id),
    ]);

    return NextResponse.json({
      folder: {
        ...folder,
        files_count: filesCount.count || 0,
        subfolders_count: subFoldersCount.count || 0,
      },
    });
  } catch (error) {
    console.error("Get folder error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a folder
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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.parent_folder_id !== undefined) updateData.parent_folder_id = body.parent_folder_id;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.is_shared !== undefined) updateData.is_shared = body.is_shared;
    if (body.shared_with !== undefined) updateData.shared_with = body.shared_with;

    const { data: folder, error } = await supabase
      .from("folders")
      .update(updateData)
      .eq("id", id)
      .select(`*`)
      .single();

    if (error) {
      console.error("Update folder error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a folder
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

    // Delete the folder (files will have folder_id set to null due to ON DELETE SET NULL)
    const { error } = await supabase.from("folders").delete().eq("id", id);

    if (error) {
      console.error("Delete folder error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
