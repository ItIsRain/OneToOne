import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../auth/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!event || event.id !== payload.eventId) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Validate MIME type - block executable and script files
    const blockedTypes = [
      "application/x-executable", "application/x-msdos-program", "application/x-msdownload",
      "application/x-sh", "application/x-csh", "application/x-httpd-php",
      "text/html", "application/javascript", "text/javascript",
      "application/x-bat", "application/x-msi",
    ];
    const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".com", ".scr", ".php", ".js", ".html", ".htm", ".hta", ".vbs", ".wsf"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (blockedTypes.includes(file.type) || blockedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Create a unique filename
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID().substring(0, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${payload.attendeeId}/${timestamp}_${randomStr}_${sanitizedName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("submissions")
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
