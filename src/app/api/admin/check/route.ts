import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ isAdmin: false, reason: "not_authenticated" });
    }

    const userEmail = user.email.toLowerCase();

    // Check if user email exists in platform_admins table
    const { data: adminRecord, error } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (error) {
      console.error("Error checking admin status:", error);
      return NextResponse.json({ isAdmin: false, reason: "db_error" });
    }

    if (!adminRecord) {
      return NextResponse.json({ isAdmin: false, reason: "not_admin" });
    }

    return NextResponse.json({ isAdmin: true, email: userEmail });
  } catch (err) {
    console.error("Admin check error:", err);
    return NextResponse.json({ isAdmin: false, reason: "error" });
  }
}
