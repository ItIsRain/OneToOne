import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

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

// Sanitize filename for Cloudinary public_id
function sanitizePublicId(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "_") // Replace special chars with underscore
    .substring(0, 50); // Limit length
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { file, fileName, fileType } = await request.json();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    // Determine resource type based on file type
    const resourceType = fileType?.startsWith("image/")
      ? "image"
      : fileType?.startsWith("video/")
      ? "video"
      : "raw";

    // Sanitize the filename for public_id
    const sanitizedName = sanitizePublicId(fileName || "file");
    const publicId = `${Date.now()}-${sanitizedName}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: "attachments",
      resource_type: resourceType,
      public_id: publicId,
      // Preserve original file extension for raw files
      ...(resourceType === "raw" && { format: fileName?.split(".").pop() }),
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: fileName || uploadResult.original_filename,
      fileType: fileType || uploadResult.resource_type,
      fileSize: uploadResult.bytes,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Handle multiple file uploads
export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { files } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const uploadPromises = files.map(async ({ file, fileName, fileType }) => {
      const resourceType = fileType?.startsWith("image/")
        ? "image"
        : fileType?.startsWith("video/")
        ? "video"
        : "raw";

      const sanitizedName = sanitizePublicId(fileName || "file");
      const publicId = `${Date.now()}-${sanitizedName}`;

      const uploadResult = await cloudinary.uploader.upload(file, {
        folder: "attachments",
        resource_type: resourceType,
        public_id: publicId,
        ...(resourceType === "raw" && { format: fileName?.split(".").pop() }),
      });

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: fileName || uploadResult.original_filename,
        fileType: fileType || uploadResult.resource_type,
        fileSize: uploadResult.bytes,
      };
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({ attachments: results });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
