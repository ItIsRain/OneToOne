import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { validateAttachmentUpload } from "@/lib/upload-validation";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// Sanitize filename for Cloudinary public_id
function sanitizePublicId(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "_") // Replace special chars with underscore
    .substring(0, 50); // Limit length
}

export async function POST(request: Request) {
  try {
    // Fast auth check from middleware header
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { file, fileName, fileType } = await request.json();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    if (typeof file === "string" && file.startsWith("data:")) {
      const validation = validateAttachmentUpload(file, fileType);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
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
    const publicId = `${crypto.randomUUID().substring(0, 12)}-${sanitizedName}`;

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
    // Fast auth check from middleware header
    const userId = getUserIdFromRequest(request);
    if (!userId) {
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

    // Validate all files before uploading
    for (const { file: f, fileType: ft } of files) {
      if (typeof f === "string" && f.startsWith("data:")) {
        const validation = validateAttachmentUpload(f, ft);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      }
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
      const publicId = `${crypto.randomUUID().substring(0, 12)}-${sanitizedName}`;

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
