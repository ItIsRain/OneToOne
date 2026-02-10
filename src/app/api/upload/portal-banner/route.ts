import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { validateImageUpload } from "@/lib/upload-validation";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// Parse CLOUDINARY_URL
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  const matches = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (matches) {
    cloudinary.config({
      cloud_name: matches[3],
      api_key: matches[1],
      api_secret: matches[2],
    });
  }
}

export async function POST(request: Request) {
  try {
    // Fast auth check from middleware header
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create supabase client for DB operations
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validation = validateImageUpload(image);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to Cloudinary — optimised for a full-width hero banner
    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: "portal-banners",
      transformation: [
        { width: 1920, height: 900, crop: "fill", gravity: "auto" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error("Portal banner upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
