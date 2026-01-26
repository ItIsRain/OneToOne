import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH - Update payment method (set as default)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { is_default } = body;

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("tenant_id", profile.tenant_id);
    }

    const { data: paymentMethod, error } = await supabase
      .from("payment_methods")
      .update({
        is_default,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentMethod,
      message: is_default ? "Default payment method updated" : "Payment method updated",
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if it's the default payment method
    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("is_default")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (paymentMethod?.is_default) {
      // Check if there are other payment methods
      const { count } = await supabase
        .from("payment_methods")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id);

      if (count && count > 1) {
        return NextResponse.json(
          { error: "Cannot delete default payment method. Set another as default first." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Error deleting payment method:", error);
      return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment method removed successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
