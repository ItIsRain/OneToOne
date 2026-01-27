import { headers } from "next/headers";

export interface TenantContext {
  tenantId: string | null;
  subdomain: string | null;
  name: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  isSubdomainAccess: boolean;
}

/**
 * Server-side function to read tenant context from middleware-injected headers.
 * Use this in Server Components and API routes to get tenant information
 * when accessed via subdomain or custom domain.
 */
export async function getTenantFromHeaders(): Promise<TenantContext> {
  const headersList = await headers();

  const tenantId = headersList.get("x-tenant-id");
  const subdomain = headersList.get("x-tenant-subdomain");
  const name = headersList.get("x-tenant-name");
  const logoUrl = headersList.get("x-tenant-logo");
  const primaryColor = headersList.get("x-tenant-color");

  return {
    tenantId,
    subdomain,
    name,
    logoUrl,
    primaryColor,
    isSubdomainAccess: !!tenantId,
  };
}

/**
 * Helper function to read tenant ID from request headers in API routes.
 * @param request NextRequest object
 */
export function getTenantIdFromRequest(request: Request): string | null {
  return request.headers.get("x-tenant-id");
}

/**
 * Helper function to read full tenant context from request headers in API routes.
 * @param request NextRequest object
 */
export function getTenantContextFromRequest(request: Request): TenantContext {
  const tenantId = request.headers.get("x-tenant-id");
  const subdomain = request.headers.get("x-tenant-subdomain");
  const name = request.headers.get("x-tenant-name");
  const logoUrl = request.headers.get("x-tenant-logo");
  const primaryColor = request.headers.get("x-tenant-color");

  return {
    tenantId,
    subdomain,
    name,
    logoUrl,
    primaryColor,
    isSubdomainAccess: !!tenantId,
  };
}
