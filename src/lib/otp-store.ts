// In-memory store for OTPs (use Redis or database in production)
export const otpStore = new Map<string, { otp: string; expires: number }>();
