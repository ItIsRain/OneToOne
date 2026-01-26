import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all payment methods
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: paymentMethods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
    }

    return NextResponse.json({ paymentMethods: paymentMethods || [] });
  } catch (error) {
    console.error("Error in payment methods:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new payment method
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const { card_brand, card_last_four, card_exp_month, card_exp_year, is_default } = body;

    if (!card_brand || !card_last_four || !card_exp_month || !card_exp_year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If this is the default card, unset other defaults
    if (is_default) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("tenant_id", profile.tenant_id);
    }

    // Check if this is the first payment method
    const { count } = await supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    const { data: paymentMethod, error } = await supabase
      .from("payment_methods")
      .insert({
        tenant_id: profile.tenant_id,
        type: "card",
        card_brand,
        card_last_four,
        card_exp_month,
        card_exp_year,
        is_default: is_default || count === 0, // First card is always default
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding payment method:", error);
      return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentMethod,
      message: "Payment method added successfully",
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
