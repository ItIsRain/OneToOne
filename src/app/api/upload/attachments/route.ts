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

    // Determine resource type based on file type
    const resourceType = fileType?.startsWith("image/")
      ? "image"
      : fileType?.startsWith("video/")
      ? "video"
      : "raw";

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: "attachments",
      resource_type: resourceType,
      public_id: `${Date.now()}-${fileName?.replace(/\.[^/.]+$/, "") || "file"}`,
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
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
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

    const uploadPromises = files.map(async ({ file, fileName, fileType }) => {
      const resourceType = fileType?.startsWith("image/")
        ? "image"
        : fileType?.startsWith("video/")
        ? "video"
        : "raw";

      const uploadResult = await cloudinary.uploader.upload(file, {
        folder: "attachments",
        resource_type: resourceType,
        public_id: `${Date.now()}-${fileName?.replace(/\.[^/.]+$/, "") || "file"}`,
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
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
