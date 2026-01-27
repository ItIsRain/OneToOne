import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";

// Helper to generate secure API key
function generateApiKey(): string {
  const prefix = "sk_live_";
  const randomPart = crypto.randomBytes(32).toString("base64url");
  return `${prefix}${randomPart}`;
}

// Helper to hash API key
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// GET - List all API keys
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

    // Check plan feature access for API access
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const apiAccess = checkFeatureAccess(planInfo.planType, "api_keys");
    if (!apiAccess.allowed) {
      return NextResponse.json(
        {
          error: apiAccess.reason,
          upgrade_required: apiAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    const { data: apiKeys, error } = await supabase
      .from("api_keys")
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_at,
        updated_at,
        created_by,
        profiles:created_by (
          first_name,
          last_name,
          email
        )
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
    }

    return NextResponse.json({ apiKeys: apiKeys || [] });
  } catch (error) {
    console.error("Error in API keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new API key
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

    // Check plan feature access for API access
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const apiAccess = checkFeatureAccess(planInfo.planType, "api_keys");
    if (!apiAccess.allowed) {
      return NextResponse.json(
        {
          error: apiAccess.reason,
          upgrade_required: apiAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, permissions, expires_at } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate the API key
    const fullKey = generateApiKey();
    const keyPrefix = fullKey.substring(0, 12) + "...";
    const keyHash = hashApiKey(fullKey);

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions: permissions || ["read"],
        expires_at: expires_at || null,
        is_active: true,
        created_by: user.id,
      })
      .select(`
        id,
        name,
        key_prefix,
        permissions,
        expires_at,
        is_active,
        created_at
      `)
      .single();

    if (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
    }

    // Return the full key only once - this is the only time it will be visible
    return NextResponse.json({
      success: true,
      apiKey: {
        ...apiKey,
        full_key: fullKey, // Only returned on creation!
      },
      message: "API key created successfully. Make sure to copy your key now - you won't be able to see it again!",
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
