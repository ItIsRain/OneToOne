import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import { scanFileForMalware, calculateFileHash, checkFileHash } from "@/lib/virustotal";

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

// Helper to determine file type category
function getFileTypeCategory(mimeType: string, extension: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    extension === "xlsx" ||
    extension === "xls" ||
    extension === "csv"
  )
    return "spreadsheet";
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    extension === "doc" ||
    extension === "docx"
  )
    return "document";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    extension === "ppt" ||
    extension === "pptx"
  )
    return "presentation";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip")
  )
    return "archive";
  if (
    mimeType.includes("text") ||
    extension === "txt" ||
    extension === "md" ||
    extension === "json" ||
    extension === "xml"
  )
    return "text";
  return "other";
}

// GET - Fetch all files for the user's tenant
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const folderId = searchParams.get("folder_id");
    const fileType = searchParams.get("file_type");
    const isStarred = searchParams.get("is_starred");
    const isArchived = searchParams.get("is_archived");
    const search = searchParams.get("search");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from("files")
      .select(
        `
        *,
        folder:folders(id, name, color)
      `
      )
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (folderId === "root" || folderId === "") {
      query = query.is("folder_id", null);
    } else if (folderId) {
      query = query.eq("folder_id", folderId);
    }

    if (fileType) {
      query = query.eq("file_type", fileType);
    }
    if (isStarred === "true") {
      query = query.eq("is_starred", true);
    }
    if (isArchived === "true") {
      query = query.eq("is_archived", true);
    } else if (isArchived !== "all") {
      // By default, don't show archived files
      query = query.eq("is_archived", false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,original_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error("Fetch files error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const allFilesQuery = await supabase
      .from("files")
      .select("file_size, file_type, is_starred, is_archived")
      .eq("tenant_id", profile.tenant_id);

    const allFiles = allFilesQuery.data || [];
    const stats = {
      total_files: allFiles.length,
      total_size: allFiles.reduce((sum, f) => sum + (f.file_size || 0), 0),
      by_type: {
        image: allFiles.filter((f) => f.file_type === "image").length,
        document: allFiles.filter((f) => f.file_type === "document").length,
        video: allFiles.filter((f) => f.file_type === "video").length,
        audio: allFiles.filter((f) => f.file_type === "audio").length,
        other: allFiles.filter(
          (f) => !["image", "document", "video", "audio"].includes(f.file_type)
        ).length,
      },
      starred: allFiles.filter((f) => f.is_starred).length,
      archived: allFiles.filter((f) => f.is_archived).length,
    };

    return NextResponse.json({ files, stats });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Upload a new file
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { file, name, folder_id, description, tags, is_shared, shared_with } = body;

    // Extract file info from base64
    const mimeMatch = file.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const base64Data = file.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");
    const fileSize = fileBuffer.length;

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_FILE_SIZE) {
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File size (${fileSizeMB}MB) exceeds the 50MB limit. Please upload a smaller file.`,
          code: "FILE_TOO_LARGE"
        },
        { status: 400 }
      );
    }

    // Get file extension from name
    const extension = name.split(".").pop()?.toLowerCase() || "";
    const fileType = getFileTypeCategory(mimeType, extension);

    // ============================================
    // VIRUSTOTAL MALWARE SCAN
    // ============================================
    // First, check if this file hash has been scanned before (faster)
    const fileHash = await calculateFileHash(fileBuffer);
    let scanResult = await checkFileHash(fileHash);

    // If not previously scanned, upload for new scan
    if (!scanResult) {
      scanResult = await scanFileForMalware(base64Data, name);
    }

    // Block upload if file is detected as malicious
    if (!scanResult.isSafe) {
      const errorMessage = scanResult.error
        ? `File scan failed: ${scanResult.error}`
        : `File rejected: Detected as malicious by ${scanResult.stats?.malicious || 0} security vendors`;

      console.warn(`Malicious file upload blocked: ${name}`, {
        userId: user.id,
        tenantId: profile.tenant_id,
        stats: scanResult.stats,
      });

      return NextResponse.json(
        {
          error: errorMessage,
          scanResult: {
            malicious: scanResult.stats?.malicious || 0,
            suspicious: scanResult.stats?.suspicious || 0,
          }
        },
        { status: 400 }
      );
    }

    // Determine Cloudinary resource type
    let resourceType: "image" | "video" | "raw" | "auto" = "auto";
    if (fileType === "image") resourceType = "image";
    else if (fileType === "video" || fileType === "audio") resourceType = "video";
    else resourceType = "raw";

    // Upload to Cloudinary (file passed malware scan)
    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: `documents/${profile.tenant_id}`,
      resource_type: resourceType,
      public_id: `${crypto.randomUUID().substring(0, 12)}_${name.replace(/\.[^/.]+$/, "")}`,
      use_filename: true,
      unique_filename: true,
    });

    // Generate thumbnail URL for images
    let thumbnailUrl: string | null = null;
    if (fileType === "image") {
      thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        width: 200,
        height: 200,
        crop: "fill",
        format: "jpg",
      });
    }

    // Create file record in database
    const fileData = {
      tenant_id: profile.tenant_id,
      folder_id: folder_id || null,
      name: name,
      original_name: name,
      description: description || null,
      file_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      file_type: fileType,
      mime_type: mimeType,
      file_size: fileSize,
      file_extension: extension,
      thumbnail_url: thumbnailUrl,
      tags: tags || [],
      is_shared: is_shared || false,
      shared_with: shared_with || [],
      uploaded_by: user.id,
      metadata: {
        cloudinary_format: uploadResult.format,
        cloudinary_resource_type: uploadResult.resource_type,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        duration: uploadResult.duration || null,
        // VirusTotal scan results
        virustotal_scan: {
          scanned_at: new Date().toISOString(),
          file_hash: fileHash,
          analysis_id: scanResult.analysisId || null,
          stats: scanResult.stats,
        },
      },
    };

    const { data: fileRecord, error } = await supabase
      .from("files")
      .insert(fileData)
      .select(
        `
        *,
        folder:folders(id, name, color)
      `
      )
      .single();

    if (error) {
      console.error("Insert file error:", error);
      // Try to delete from Cloudinary if database insert fails
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: resourceType,
        });
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
