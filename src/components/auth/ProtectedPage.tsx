'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { useAuth } from '@/context/AuthContext';
import { PermissionId } from '@/lib/permissions';
import { AccessDenied } from './AccessDenied';

interface ProtectedPageProps {
  /**
   * Single permission required to view this page
   */
  permission?: PermissionId | string;

  /**
   * Multiple permissions - user needs ANY of these
   */
  anyOf?: (PermissionId | string)[];

  /**
   * Multiple permissions - user needs ALL of these
   */
  allOf?: (PermissionId | string)[];

  /**
   * Page content
   */
  children: ReactNode;

  /**
   * Custom access denied message
   */
  deniedMessage?: string;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
}

/**
 * ProtectedPage - Wraps page content with permission check
 *
 * Shows loading state while checking permissions, then either renders
 * children or AccessDenied component.
 *
 * @example
 * export default function FinancePage() {
 *   return (
 *     <ProtectedPage permission="finance-view">
 *       <FinanceDashboard />
 *     </ProtectedPage>
 *   );
 * }
 */
export function ProtectedPage({
  permission,
  anyOf,
  allOf,
  children,
  deniedMessage,
  loadingComponent,
}: ProtectedPageProps) {
  const { loading: authLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading } = usePermissions();

  // Wait for both auth and permissions to load before rendering content
  const isLoading = authLoading || permissionsLoading;

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Checking permissions...
            </p>
          </div>
        </div>
      )
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  } else {
    // No permission specified - deny access by default for security
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'ProtectedPage: No permission, anyOf, or allOf specified. Access denied by default. ' +
        'Please specify at least one permission requirement.'
      );
    }
    hasAccess = false;
  }

  if (!hasAccess) {
    return <AccessDenied message={deniedMessage} />;
  }

  return <>{children}</>;
}

export default ProtectedPage;
