import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otp-store";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const stored = otpStore.get(email);

    if (!stored) {
      return NextResponse.json({ error: "OTP expired or not found" }, { status: 400 });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    if (stored.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP verified, remove from store
    otpStore.delete(email);

    return NextResponse.json({ success: true, message: "Email verified" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
