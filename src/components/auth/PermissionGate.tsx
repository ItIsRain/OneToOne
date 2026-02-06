'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { PermissionId } from '@/lib/permissions';

interface PermissionGateProps {
  /**
   * Single permission required
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
   * Content to render when permission is granted
   */
  children: ReactNode;

  /**
   * Content to render when permission is denied (optional)
   */
  fallback?: ReactNode;

  /**
   * If true, shows loading state while checking permissions
   */
  showLoading?: boolean;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGate permission="projects-create">
 *   <CreateProjectButton />
 * </PermissionGate>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={['projects-edit', 'projects-delete']}>
 *   <EditControls />
 * </PermissionGate>
 *
 * @example
 * // All permissions required
 * <PermissionGate allOf={['finance-view', 'invoices-create']}>
 *   <InvoiceCreator />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="settings-edit" fallback={<p>View only</p>}>
 *   <SettingsEditor />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading && showLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
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
    // This prevents misconfigured gates from accidentally granting access
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'PermissionGate: No permission, anyOf, or allOf specified. Access denied by default. ' +
        'Please specify at least one permission requirement.'
      );
    }
    hasAccess = false;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * useCanAccess - Hook version for programmatic permission checks
 */
export function useCanAccess(
  permission?: PermissionId | string,
  anyOf?: (PermissionId | string)[],
  allOf?: (PermissionId | string)[]
): { canAccess: boolean; loading: boolean } {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  let canAccess = false;

  if (permission) {
    canAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    canAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    canAccess = hasAllPermissions(allOf);
  } else {
    // No permission specified - deny access by default for security
    canAccess = false;
  }

  return { canAccess, loading };
}

export default PermissionGate;
