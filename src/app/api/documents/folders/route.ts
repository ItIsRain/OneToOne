import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// GET - Fetch all folders for the user's tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const parentId = searchParams.get("parent_id");

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
      .from("folders")
      .select(`*`)
      .eq("tenant_id", profile.tenant_id)
      .order("name", { ascending: true });

    // Filter by parent folder
    if (parentId === "root" || parentId === null || parentId === "") {
      query = query.is("parent_folder_id", null);
    } else if (parentId) {
      query = query.eq("parent_folder_id", parentId);
    }

    const { data: folders, error } = await query;

    if (error) {
      console.error("Fetch folders error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Get folders error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new folder
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

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

    const folderData = {
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description || null,
      parent_folder_id: body.parent_folder_id || null,
      color: body.color || "#6366f1",
      icon: body.icon || "folder",
      is_shared: body.is_shared || false,
      shared_with: body.shared_with || [],
      created_by: userId,
    };

    const { data: folder, error } = await supabase
      .from("folders")
      .insert(folderData)
      .select(`*`)
      .single();

    if (error) {
      console.error("Insert folder error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
