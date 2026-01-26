import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary - support both URL format and separate env vars
const cloudinaryUrl = process.env.CLOUDINARY_URL;
let cloudinaryConfigured = false;

if (cloudinaryUrl) {
  // Try parsing CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const matches = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (matches) {
    cloudinary.config({
      cloud_name: matches[3],
      api_key: matches[1],
      api_secret: matches[2],
    });
    cloudinaryConfigured = true;
  }
}

// Fallback to separate env vars if URL parsing failed
if (!cloudinaryConfigured && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinaryConfigured = true;
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
    // Auth is optional for now - uncomment below to require login
    // const supabase = await getSupabaseClient();
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { file, fileName, fileType } = await request.json();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!cloudinaryConfigured) {
      console.error("Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET");
      return NextResponse.json({
        error: "Cloudinary not configured. Please check your environment variables."
      }, { status: 500 });
    }

    // Determine resource type based on file type
    // Note: audio files should use "video" resource type in Cloudinary
    const isAudio = fileType?.startsWith("audio/");
    const isVideo = fileType?.startsWith("video/");
    const isImage = fileType?.startsWith("image/");

    const resourceType = isImage
      ? "image"
      : (isVideo || isAudio)
      ? "video"
      : "raw";

    // Sanitize the filename for public_id
    const sanitizedName = sanitizePublicId(fileName || "file");
    const publicId = `${Date.now()}-${sanitizedName}`;

    // For audio/video, we need to ensure the data URI is properly formatted
    // Cloudinary accepts data URIs but needs them to be valid
    let uploadData = file;

    // If it's a data URI, make sure it's properly formatted
    if (typeof file === "string" && file.startsWith("data:")) {
      // For audio/video webm files, Cloudinary may have issues with codecs in mime type
      // Simplify the mime type in the data URI
      if (isAudio || isVideo) {
        uploadData = file.replace(/^data:(audio|video)\/webm;codecs=[^;]+;/, "data:$1/webm;");
      }
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(uploadData, {
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
    if (!cloudinaryConfigured) {
      console.error("Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET");
      return NextResponse.json({
        error: "Cloudinary not configured. Please check your environment variables."
      }, { status: 500 });
    }

    const uploadPromises = files.map(async ({ file, fileName, fileType }) => {
      // Note: audio files should use "video" resource type in Cloudinary
      const isAudio = fileType?.startsWith("audio/");
      const isVideo = fileType?.startsWith("video/");
      const isImage = fileType?.startsWith("image/");

      const resourceType = isImage
        ? "image"
        : (isVideo || isAudio)
        ? "video"
        : "raw";

      const sanitizedName = sanitizePublicId(fileName || "file");
      const publicId = `${Date.now()}-${sanitizedName}`;

      // Handle data URI format for audio/video
      let uploadData = file;
      if (typeof file === "string" && file.startsWith("data:")) {
        if (isAudio || isVideo) {
          uploadData = file.replace(/^data:(audio|video)\/webm;codecs=[^;]+;/, "data:$1/webm;");
        }
      }

      const uploadResult = await cloudinary.uploader.upload(uploadData, {
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
