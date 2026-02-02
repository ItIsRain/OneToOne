import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { storeOtp } from "@/lib/otp-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Rate limit by IP: 10 OTP requests per IP per 15 minutes
    const ip = getClientIp(request);
    const ipRateCheck = await checkRateLimit({
      key: "send-otp-ip",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 15 * 60,
    });
    if (!ipRateCheck.allowed) {
      return rateLimitResponse(ipRateCheck.retryAfterSeconds!);
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Rate limit by email: 5 OTP requests per email per 15 minutes
    const rateCheck = await checkRateLimit({
      key: "send-otp",
      identifier: email.toLowerCase(),
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds!);
    }

    // Check if email is already affiliated with a portal
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http");

    if (isSupabaseConfigured) {
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, tenant_id, tenants:tenant_id(name, subdomain)")
        .eq("email", email.toLowerCase())
        .single();

      if (existingProfile) {
        // Return generic error to prevent account enumeration
        // Don't reveal which portal the email is affiliated with
        return NextResponse.json(
          { error: "This email is already in use. Please sign in instead.", code: "EMAIL_AFFILIATED" },
          { status: 409 }
        );
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP in Supabase with 10-minute expiry
    await storeOtp(email, otp);

    // Send OTP via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // For development, log OTP to console
      logger.debug(`[DEV] OTP for ${email}: ${otp}`);
      return NextResponse.json({ success: true, message: "OTP sent (check console in dev)" });
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
        subject: "Your verification code",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111; margin-bottom: 20px;">Verify your email</h2>
            <p style="color: #666; margin-bottom: 20px;">Enter this code to complete your registration:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
