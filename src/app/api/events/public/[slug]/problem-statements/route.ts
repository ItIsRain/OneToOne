import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - List all problem statements for an event
// Note: This endpoint requires the event_problem_statements table to exist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, is_public, is_published")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_public || !event.is_published) {
      return NextResponse.json({ error: "Event not accessible" }, { status: 403 });
    }

    // Try to get problem statements - return empty array if table doesn't exist
    try {
      const { data: problemStatements, error: psError } = await supabase
        .from("event_problem_statements")
        .select(`
          id, title, description, category, difficulty, resources, created_at
        `)
        .eq("event_id", event.id)
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("title", { ascending: true });

      if (psError) {
        // Table might not exist - return empty array
        console.log("Problem statements table may not exist:", psError.message);
        return NextResponse.json({ problemStatements: [] });
      }

      return NextResponse.json({ problemStatements: problemStatements || [] });
    } catch {
      // Table doesn't exist - return empty array
      return NextResponse.json({ problemStatements: [] });
    }
  } catch (error) {
    console.error("Problem statements fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
