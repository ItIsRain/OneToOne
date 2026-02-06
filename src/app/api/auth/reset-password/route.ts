import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 reset requests per IP per 15 minutes
    const ip = getClientIp(request);
    const ipRateCheck = await checkRateLimit({
      key: "reset-password-ip",
      identifier: ip,
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });
    if (!ipRateCheck.allowed) {
      return rateLimitResponse(ipRateCheck.retryAfterSeconds!);
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // NOTE: We intentionally do NOT rate limit by email here.
    // Email-based rate limiting can reveal whether an account exists (timing attack).
    // IP-based limiting above is sufficient for DoS prevention.

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists by looking up their profile (avoids fetching ALL users)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (!profile) {
      // Return success even if user doesn't exist to prevent account enumeration
      return NextResponse.json({ success: true });
    }

    // Generate reset link - use env var only, never trust Origin header
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${origin}/update-password`,
      },
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        { error: linkError?.message || "Failed to generate reset link" },
        { status: 400 }
      );
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const resetLink = linkData.properties?.action_link;

    if (!resendApiKey) {
      console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
      return NextResponse.json({ success: true, message: "Reset link generated (check console in dev)" });
    }

    if (!resetLink) {
      console.error("No reset link generated");
      return NextResponse.json(
        { error: "Failed to generate reset link" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "1i1 <noreply@1i1.ae>",
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111; margin-bottom: 20px;">Reset your password</h2>
            <p style="color: #666; margin-bottom: 20px;">Click the button below to reset your password:</p>
            <div style="margin-bottom: 20px;">
              <a href="${resetLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">Or copy this link: <a href="${resetLink}" style="color: #4F46E5; word-break: break-all;">${resetLink}</a></p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
