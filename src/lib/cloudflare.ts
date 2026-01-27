/**
 * Cloudflare for SaaS (SSL for SaaS) Integration
 *
 * This module provides functions to manage custom hostnames using Cloudflare's
 * SSL for SaaS API. This allows automatic SSL certificate provisioning for
 * tenant custom domains.
 *
 * Required environment variables:
 * - CLOUDFLARE_API_TOKEN: API token with "SSL and Certificates" permissions
 * - CLOUDFLARE_ZONE_ID: Zone ID for your main domain (1i1.ae)
 *
 * Setup in Cloudflare Dashboard:
 * 1. Go to SSL/TLS > Custom Hostnames
 * 2. Add a fallback origin (e.g., portal.1i1.ae pointing to your server)
 * 3. Create an API token with "Zone:SSL and Certificates:Edit" permission
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

export interface CustomHostname {
  id: string;
  hostname: string;
  ssl: {
    status: "initializing" | "pending_validation" | "pending_issuance" | "pending_deployment" | "active" | "deleted";
    method: "http" | "txt" | "email";
    type: "dv";
    validation_records?: Array<{
      status: string;
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
    }>;
    validation_errors?: Array<{ message: string }>;
  };
  status: "active" | "pending" | "active_redeploying" | "moved" | "deleted";
  verification_errors?: string[];
  ownership_verification?: {
    type: "txt";
    name: string;
    value: string;
  };
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
  created_at: string;
}

interface CreateCustomHostnameResponse {
  id: string;
  hostname: string;
  ssl: CustomHostname["ssl"];
  status: CustomHostname["status"];
  ownership_verification?: CustomHostname["ownership_verification"];
  ownership_verification_http?: CustomHostname["ownership_verification_http"];
}

function getCloudflareConfig() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    throw new Error(
      "Cloudflare configuration missing. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID environment variables."
    );
  }

  return { apiToken, zoneId };
}

async function cloudflareRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const { apiToken } = getCloudflareConfig();

  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMessage = data.errors?.[0]?.message || "Cloudflare API request failed";
    console.error("Cloudflare API error:", data.errors);
    throw new Error(errorMessage);
  }

  return data as CloudflareResponse<T>;
}

/**
 * Create a custom hostname in Cloudflare for SaaS
 *
 * @param hostname - The custom domain (e.g., "portal.customer.com")
 * @returns The created custom hostname object with SSL and verification details
 */
export async function createCustomHostname(hostname: string): Promise<CreateCustomHostnameResponse> {
  const { zoneId } = getCloudflareConfig();

  const response = await cloudflareRequest<CreateCustomHostnameResponse>(
    `/zones/${zoneId}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify({
        hostname,
        ssl: {
          method: "http", // Use HTTP validation (automatic, no DNS TXT needed)
          type: "dv",
          settings: {
            min_tls_version: "1.2",
            http2: "on",
          },
        },
      }),
    }
  );

  return response.result;
}

/**
 * Get the status of a custom hostname
 *
 * @param customHostnameId - The Cloudflare custom hostname ID
 * @returns The custom hostname object with current status
 */
export async function getCustomHostname(customHostnameId: string): Promise<CustomHostname> {
  const { zoneId } = getCloudflareConfig();

  const response = await cloudflareRequest<CustomHostname>(
    `/zones/${zoneId}/custom_hostnames/${customHostnameId}`,
    {
      method: "GET",
    }
  );

  return response.result;
}

/**
 * Delete a custom hostname from Cloudflare
 *
 * @param customHostnameId - The Cloudflare custom hostname ID
 */
export async function deleteCustomHostname(customHostnameId: string): Promise<void> {
  const { zoneId } = getCloudflareConfig();

  await cloudflareRequest<{ id: string }>(
    `/zones/${zoneId}/custom_hostnames/${customHostnameId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Refresh/retry SSL validation for a custom hostname
 * This can be used when validation is stuck or needs to be retried
 *
 * @param customHostnameId - The Cloudflare custom hostname ID
 * @returns The updated custom hostname object
 */
export async function refreshCustomHostname(customHostnameId: string): Promise<CustomHostname> {
  const { zoneId } = getCloudflareConfig();

  const response = await cloudflareRequest<CustomHostname>(
    `/zones/${zoneId}/custom_hostnames/${customHostnameId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ssl: {
          method: "http",
          type: "dv",
        },
      }),
    }
  );

  return response.result;
}

/**
 * List all custom hostnames (useful for debugging/admin)
 *
 * @param page - Page number (default 1)
 * @param perPage - Results per page (default 50)
 * @returns Array of custom hostnames
 */
export async function listCustomHostnames(
  page: number = 1,
  perPage: number = 50
): Promise<CustomHostname[]> {
  const { zoneId } = getCloudflareConfig();

  const response = await cloudflareRequest<CustomHostname[]>(
    `/zones/${zoneId}/custom_hostnames?page=${page}&per_page=${perPage}`,
    {
      method: "GET",
    }
  );

  return response.result;
}

/**
 * Get a human-readable status message for the SSL status
 */
export function getSSLStatusMessage(status: CustomHostname["ssl"]["status"]): string {
  const statusMessages: Record<CustomHostname["ssl"]["status"], string> = {
    initializing: "Initializing SSL certificate...",
    pending_validation: "Waiting for domain validation. Ensure CNAME is configured correctly.",
    pending_issuance: "Domain validated. SSL certificate is being issued...",
    pending_deployment: "SSL certificate issued. Deploying to edge servers...",
    active: "SSL certificate is active and working.",
    deleted: "SSL certificate has been deleted.",
  };

  return statusMessages[status] || "Unknown status";
}

/**
 * Check if the custom hostname is fully active (SSL ready)
 */
export function isCustomHostnameActive(hostname: CustomHostname): boolean {
  return hostname.status === "active" && hostname.ssl.status === "active";
}

/**
 * Get the fallback origin hostname that customers should CNAME to
 * This should be configured in your Cloudflare for SaaS settings
 */
export function getFallbackOrigin(): string {
  return process.env.CLOUDFLARE_FALLBACK_ORIGIN || "portal.1i1.ae";
}
