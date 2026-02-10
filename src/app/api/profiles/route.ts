import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch all profiles in the same tenant
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, role")
      .eq("tenant_id", currentProfile.tenant_id)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Error in profiles GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
