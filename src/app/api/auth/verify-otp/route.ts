import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Rate limit: 5 verification attempts per email per 15 minutes
    const rateCheck = await checkRateLimit({
      key: "verify-otp",
      identifier: email.toLowerCase(),
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds!);
    }

    const isValid = await verifyOtp(email, otp);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email verified" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
