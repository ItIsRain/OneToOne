import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 10-minute expiry
    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // For development, log OTP to console
      console.log(`[DEV] OTP for ${email}: ${otp}`);
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
