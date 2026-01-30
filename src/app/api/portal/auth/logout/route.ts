import { NextResponse } from "next/server";

// POST - Portal client logout
// Client-side handles clearing local storage/session data.
export async function POST() {
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
