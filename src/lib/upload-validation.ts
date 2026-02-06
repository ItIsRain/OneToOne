const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB

// NOTE: SVG is NOT allowed due to XSS risk (can contain embedded JavaScript)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
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

/**
 * Magic byte signatures for file type validation.
 * This provides defense-in-depth against MIME type spoofing.
 */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/gif": [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP starts with RIFF...WEBP)
  ],
  "application/pdf": [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  // Office documents use ZIP format (PK header)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP)
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK (ZIP)
  ],
  // Legacy Office formats use Compound File Binary Format
  "application/msword": [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // DOC
  ],
  "application/vnd.ms-excel": [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // XLS
  ],
  // Audio formats
  "audio/mpeg": [
    { offset: 0, bytes: [0xff, 0xfb] }, // MP3 frame sync
    { offset: 0, bytes: [0xff, 0xfa] }, // MP3 frame sync
    { offset: 0, bytes: [0x49, 0x44, 0x33] }, // ID3 tag
  ],
  "audio/wav": [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }], // RIFF
  "audio/ogg": [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  "audio/webm": [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // EBML/WebM
  // Video formats
  "video/mp4": [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }, // ftyp at offset 4
  ],
  "video/webm": [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // EBML
  "video/quicktime": [
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74] }, // ftypqt
    { offset: 4, bytes: [0x6d, 0x6f, 0x6f, 0x76] }, // moov
  ],
};

/**
 * Validate file content against expected magic bytes.
 * Returns true if validation passes or if no magic bytes are defined for the type.
 */
function validateMagicBytes(base64Content: string, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];

  // No signature defined - allow but log (text files don't have reliable signatures)
  if (!signatures) {
    return true;
  }

  try {
    // Decode enough base64 to check magic bytes (first 16 bytes is usually sufficient)
    const base64Chunk = base64Content.slice(0, 24); // 24 base64 chars = 18 bytes
    const binaryString = atob(base64Chunk);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check if any of the valid signatures match
    return signatures.some((sig) => {
      if (sig.offset + sig.bytes.length > bytes.length) {
        return false; // Not enough bytes to check
      }
      return sig.bytes.every((b, i) => bytes[sig.offset + i] === b);
    });
  } catch {
    // Invalid base64 - reject
    return false;
  }
}

function getDataUriMimeType(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;,]+)/);
  return match ? match[1] : null;
}

function estimateBase64Size(dataUri: string): number {
  // Remove the data URI prefix to get just the base64 content
  const base64 = dataUri.split(",")[1] || dataUri;
  // Count padding characters (=) which don't contribute to decoded size
  const paddingCount = (base64.match(/=+$/) || [""])[0].length;
  // Base64 encodes 3 bytes in 4 chars, subtract padding from length
  // Each '=' represents 2 bits of padding, so we subtract those bytes
  const effectiveLength = base64.length - paddingCount;
  return Math.ceil((effectiveLength * 3) / 4);
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
    return { valid: false, error: `File type not allowed. Accepted: JPEG, PNG, GIF, WebP` };
  }

  const estimatedSize = estimateBase64Size(dataUri);
  if (estimatedSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 10MB` };
  }

  // Validate magic bytes to prevent MIME type spoofing
  const base64Content = dataUri.split(",")[1] || "";
  if (!validateMagicBytes(base64Content, mimeType)) {
    return { valid: false, error: "File content does not match declared type" };
  }

  return { valid: true };
}

export function validateAttachmentUpload(dataUri: string, fileType?: string): ValidationResult {
  if (typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
    return { valid: false, error: "Invalid file format" };
  }

  // Always validate actual data URI MIME type - don't trust user-provided fileType
  const actualMimeType = getDataUriMimeType(dataUri);
  if (!actualMimeType) {
    return { valid: false, error: "Could not determine file type" };
  }

  // If fileType is provided, verify it matches the actual content (prevents spoofing)
  if (fileType && fileType !== actualMimeType) {
    return { valid: false, error: "File type mismatch - content doesn't match declared type" };
  }

  if (!ALLOWED_ATTACHMENT_TYPES.includes(actualMimeType)) {
    return { valid: false, error: `File type "${actualMimeType}" is not allowed` };
  }

  const estimatedSize = estimateBase64Size(dataUri);
  if (estimatedSize > MAX_ATTACHMENT_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 25MB` };
  }

  // Validate magic bytes to prevent MIME type spoofing
  // (text/plain and text/csv are exempt as they don't have reliable signatures)
  if (actualMimeType !== "text/plain" && actualMimeType !== "text/csv") {
    const base64Content = dataUri.split(",")[1] || "";
    if (!validateMagicBytes(base64Content, actualMimeType)) {
      return { valid: false, error: "File content does not match declared type" };
    }
  }

  return { valid: true };
}
