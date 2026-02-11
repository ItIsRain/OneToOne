import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateProfileSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const updates = await request.json();

    // Validate input
    const validation = validateBody(updateProfileSchema, updates);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "first_name",
      "last_name",
      "phone",
      "bio",
      "avatar_url",
      "country",
      "city",
      "postal_code",
      "tax_id",
    ];

    const sanitizedUpdates: Record<string, string> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(sanitizedUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
