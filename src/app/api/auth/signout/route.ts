import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    const res = NextResponse.json({ success: true });
    // Clear the subscription cache cookie on sign-out
    res.cookies.set("1i1_sub_ok", "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
