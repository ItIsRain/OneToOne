import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cleans up expired OTP codes and old rate limit entries.
// Should be called by a cron job (e.g. Vercel Cron, external scheduler).
// Recommended schedule: every hour.
// Protected by CRON_SECRET to prevent unauthorized access.

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete expired OTP codes
    const { error: otpError, count: otpCount } = await supabase
      .from("otp_codes")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString());

    // Delete rate limit entries older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { error: rlError, count: rlCount } = await supabase
      .from("rate_limits")
      .delete({ count: "exact" })
      .lt("created_at", oneHourAgo);

    const errors = [];
    if (otpError) errors.push(`otp_codes: ${otpError.message}`);
    if (rlError) errors.push(`rate_limits: ${rlError.message}`);

    return NextResponse.json({
      success: errors.length === 0,
      cleaned: {
        otp_codes: otpCount ?? 0,
        rate_limits: rlCount ?? 0,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cleanup cron error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
