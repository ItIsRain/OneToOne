/**
 * VirusTotal API Integration
 * Scans files for malware before allowing uploads
 */

interface VirusTotalUploadResponse {
  data: {
    type: string;
    id: string;
  };
}

interface VirusTotalAnalysisStats {
  confirmed_timeout: number;
  failure: number;
  harmless: number;
  malicious: number;
  suspicious: number;
  timeout: number;
  type_unsupported: number;
  undetected: number;
}

interface VirusTotalAnalysisResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      status: "queued" | "in-progress" | "completed";
      stats: VirusTotalAnalysisStats;
    };
  };
}

export interface ScanResult {
  isClean: boolean;
  isSafe: boolean;
  stats: VirusTotalAnalysisStats | null;
  error?: string;
  analysisId?: string;
}

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3";

// Max polling attempts (30 seconds total with 3s intervals)
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

/**
 * Upload a file to VirusTotal for scanning
 */
async function uploadFileToVirusTotal(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  if (!VIRUSTOTAL_API_KEY) {
    throw new Error("VirusTotal API key not configured");
  }

  // Create form data with the file
  const formData = new FormData();
  // Convert Buffer to ArrayBuffer for Blob compatibility
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer]);
  formData.append("file", blob, fileName);

  const response = await fetch(`${VIRUSTOTAL_API_URL}/files`, {
    method: "POST",
    headers: {
      "x-apikey": VIRUSTOTAL_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VirusTotal upload failed: ${response.status} - ${errorText}`);
  }

  const result: VirusTotalUploadResponse = await response.json();
  return result.data.id;
}

/**
 * Get the analysis results from VirusTotal
 */
async function getAnalysisResults(
  analysisId: string
): Promise<VirusTotalAnalysisResponse> {
  if (!VIRUSTOTAL_API_KEY) {
    throw new Error("VirusTotal API key not configured");
  }

  const response = await fetch(
    `${VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
    {
      method: "GET",
      headers: {
        "x-apikey": VIRUSTOTAL_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VirusTotal analysis fetch failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Wait for analysis to complete with polling
 */
async function waitForAnalysis(
  analysisId: string
): Promise<VirusTotalAnalysisResponse> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await getAnalysisResults(analysisId);

    if (result.data.attributes.status === "completed") {
      return result;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("VirusTotal analysis timed out");
}

/**
 * Scan a file for malware using VirusTotal
 * Returns whether the file is safe to upload
 */
export async function scanFileForMalware(
  base64Data: string,
  fileName: string
): Promise<ScanResult> {
  // Check if VirusTotal is configured
  if (!VIRUSTOTAL_API_KEY) {
    console.warn("VirusTotal API key not configured - skipping malware scan");
    return {
      isClean: true,
      isSafe: true,
      stats: null,
      error: "VirusTotal not configured - scan skipped",
    };
  }

  try {
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Upload file to VirusTotal
    const analysisId = await uploadFileToVirusTotal(fileBuffer, fileName);

    // Wait for analysis to complete
    const analysisResult = await waitForAnalysis(analysisId);
    const stats = analysisResult.data.attributes.stats;

    // Determine if file is clean
    // A file is considered malicious if ANY engine detects it as malicious or suspicious
    const isMalicious = stats.malicious > 0;
    const isSuspicious = stats.suspicious > 0;
    const isClean = !isMalicious && !isSuspicious;

    return {
      isClean,
      isSafe: isClean,
      stats,
      analysisId,
    };
  } catch (error) {
    console.error("VirusTotal scan error:", error);

    // On error, we could either:
    // 1. Block the upload (safer but may cause issues if VT is down)
    // 2. Allow the upload with a warning
    // We'll choose option 1 for security
    return {
      isClean: false,
      isSafe: false,
      stats: null,
      error: error instanceof Error ? error.message : "Malware scan failed",
    };
  }
}

/**
 * Check if a file hash has been previously scanned
 * This is faster than uploading the file again
 */
export async function checkFileHash(
  fileHash: string
): Promise<ScanResult | null> {
  if (!VIRUSTOTAL_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${VIRUSTOTAL_API_URL}/files/${fileHash}`,
      {
        method: "GET",
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
        },
      }
    );

    if (response.status === 404) {
      // File not previously scanned
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const stats = result.data.attributes.last_analysis_stats;

    const isMalicious = stats.malicious > 0;
    const isSuspicious = stats.suspicious > 0;
    const isClean = !isMalicious && !isSuspicious;

    return {
      isClean,
      isSafe: isClean,
      stats,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate SHA256 hash of a file buffer
 */
export async function calculateFileHash(fileBuffer: Buffer): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}
