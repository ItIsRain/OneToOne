const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_ATTACHMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "audio/mpeg",
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function getDataUriMimeType(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;,]+)/);
  return match ? match[1] : null;
}

function estimateBase64Size(dataUri: string): number {
  // Remove the data URI prefix to get just the base64 content
  const base64 = dataUri.split(",")[1] || dataUri;
  // Base64 encodes 3 bytes in 4 chars, so decoded size ≈ length * 3/4
  return Math.ceil(base64.length * 3 / 4);
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageUpload(dataUri: string): ValidationResult {
  if (typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
    return { valid: false, error: "Invalid file format" };
  }

  const mimeType = getDataUriMimeType(dataUri);
  if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: `File type not allowed. Accepted: JPEG, PNG, GIF, WebP, SVG` };
  }

  const estimatedSize = estimateBase64Size(dataUri);
  if (estimatedSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 10MB` };
  }

  return { valid: true };
}

export function validateAttachmentUpload(dataUri: string, fileType?: string): ValidationResult {
  if (typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
    return { valid: false, error: "Invalid file format" };
  }

  const mimeType = fileType || getDataUriMimeType(dataUri);
  if (!mimeType || !ALLOWED_ATTACHMENT_TYPES.includes(mimeType)) {
    return { valid: false, error: `File type "${mimeType}" is not allowed` };
  }

  const estimatedSize = estimateBase64Size(dataUri);
  if (estimatedSize > MAX_ATTACHMENT_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 25MB` };
  }

  return { valid: true };
}
