import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Hardcoded discount codes (can be moved to database later)
const DISCOUNT_CODES: Record<string, { discount_percent: number; description: string; max_uses?: number; expires_at?: string }> = {
  "LUNARLIMITED": {
    discount_percent: 100,
    description: "100% off - Limited time offer",
    max_uses: 1000,
  },
};

// POST - Validate and apply discount code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, plan_type, billing_interval } = body;

    if (!code) {
      return NextResponse.json({ error: "Discount code is required" }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();
    const discountCode = DISCOUNT_CODES[upperCode];

    if (!discountCode) {
      return NextResponse.json({ error: "Invalid discount code" }, { status: 400 });
    }

    // Check expiration if set
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ error: "This discount code has expired" }, { status: 400 });
    }

    // Calculate pricing
    const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
      free: { monthly: 0, yearly: 0 },
      starter: { monthly: 29, yearly: 279 },
      professional: { monthly: 79, yearly: 758 },
      business: { monthly: 199, yearly: 1910 },
    };

    const planPrice = PLAN_PRICES[plan_type || "starter"];
    const interval = billing_interval || "monthly";
    const originalPrice = planPrice[interval as "monthly" | "yearly"];
    const discountAmount = (originalPrice * discountCode.discount_percent) / 100;
    const finalPrice = originalPrice - discountAmount;

    return NextResponse.json({
      valid: true,
      code: upperCode,
      discount_percent: discountCode.discount_percent,
      description: discountCode.description,
      original_price: originalPrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
