import { createClient as createServiceClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Store an OTP for a given email address.
 * The OTP is hashed with bcrypt before storage.
 * Any existing OTP for the same email is replaced.
 */
export async function storeOtp(email: string, otp: string, ttlMs: number = 10 * 60 * 1000): Promise<void> {
  const supabase = getServiceClient();
  // Use cost 6 for OTPs - they're short-lived (10 min) and 6-digit
  // This reduces hash time from ~300ms to ~20ms
  const otpHash = await bcrypt.hash(otp, 6);
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  // Upsert: replace any existing OTP for this email
  const { error } = await supabase
    .from("otp_codes")
    .upsert(
      {
        email: email.toLowerCase(),
        otp_hash: otpHash,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }
}

/**
 * Verify an OTP for a given email address.
 * Returns true if valid and not expired, false otherwise.
 * Deletes the OTP after successful verification.
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const supabase = getServiceClient();

  // Atomically delete and return the OTP record to prevent reuse
  const { data, error } = await supabase
    .from("otp_codes")
    .delete()
    .eq("email", email.toLowerCase())
    .select("otp_hash, expires_at")
    .single();

  if (error || !data) {
    return false;
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    return false;
  }

  // Compare hash
  const isValid = await bcrypt.compare(otp, data.otp_hash);

  return isValid;
}

/**
 * Delete expired OTPs. Can be called from a cron job.
 */
export async function cleanupExpiredOtps(): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("otp_codes")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
