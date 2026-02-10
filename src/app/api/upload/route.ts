import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import { validateImageUpload } from "@/lib/upload-validation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { scanFileForMalware, calculateFileHash, checkFileHash } from "@/lib/virustotal";
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

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 avatar uploads per user per hour
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit({
      key: "avatar-upload",
      identifier: ip,
      maxRequests: 10,
      windowSeconds: 3600, // 1 hour
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds!);
    }

    // Fast auth check from middleware header
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validation = validateImageUpload(image);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract base64 data for malware scanning
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Malware scanning
    const fileHash = await calculateFileHash(fileBuffer);
    let scanResult = await checkFileHash(fileHash);

    if (!scanResult) {
      scanResult = await scanFileForMalware(base64Data, "avatar.jpg");
    }

    if (!scanResult.isSafe) {
      console.warn(`Malicious avatar upload blocked for user ${userId}`, {
        stats: scanResult.stats,
      });
      return NextResponse.json(
        { error: "File rejected: Security scan failed" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary (passed security checks)
    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: "avatars",
      transformation: [
        { width: 200, height: 200, crop: "fill", gravity: "face" },
      ],
    });

    // Create supabase client only when needed for DB operations
    const supabase = await getSupabaseClient();

    // Update profile with new avatar URL
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: uploadResult.secure_url })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile, url: uploadResult.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
