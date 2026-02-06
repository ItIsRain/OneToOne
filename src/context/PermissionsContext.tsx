'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { PermissionId } from '@/lib/permissions';

// localStorage caching for instant load
const PERMISSIONS_CACHE_KEY = 'permissions_cache_v1';
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface CachedPermissions {
  userId: string;
  permissions: string[];
  role: string | null;
  customRoleName: string | null;
  isFullAccess: boolean;
  timestamp: number;
}

function getCachedPermissions(userId: string): CachedPermissions | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    if (!cached) return null;
    const data: CachedPermissions = JSON.parse(cached);
    // Check if cache is for same user and still fresh
    if (data.userId !== userId || Date.now() - data.timestamp > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(PERMISSIONS_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedPermissions(data: Omit<CachedPermissions, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      PERMISSIONS_CACHE_KEY,
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {
    // Ignore quota errors
  }
}

export function clearPermissionsCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}

interface PermissionsContextType {
  permissions: string[];
  role: string | null;
  customRoleName: string | null;
  isFullAccess: boolean;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: PermissionId | string) => boolean;
  hasAnyPermission: (permissions: (PermissionId | string)[]) => boolean;
  hasAllPermissions: (permissions: (PermissionId | string)[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  role: null,
  customRoleName: null,
  isFullAccess: false,
  loading: true,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: async () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [customRoleName, setCustomRoleName] = useState<string | null>(null);
  const [isFullAccess, setIsFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const initialCacheRef = useRef<CachedPermissions | null>(null);

  // On mount, check cache and apply immediately (client-side only)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
      if (cached) {
        const data: CachedPermissions = JSON.parse(cached);
        if (Date.now() - data.timestamp <= CACHE_MAX_AGE_MS) {
          initialCacheRef.current = data;
          setPermissions(data.permissions);
          setRole(data.role);
          setCustomRoleName(data.customRoleName);
          setIsFullAccess(data.isFullAccess);
          setLoading(false);
        }
      }
    } catch {
      // Ignore cache errors
    }
    setHasMounted(true);
  }, []);

  // Track the current request to ignore stale responses
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPermissions = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!user) {
      // Don't clear cached data if we have it - user might still be loading
      if (!initialCacheRef.current) {
        setPermissions([]);
        setRole(null);
        setCustomRoleName(null);
        setIsFullAccess(false);
        clearPermissionsCache();
      }
      setLoading(false);
      return;
    }

    // Validate cache is for current user
    const cached = getCachedPermissions(user.id);
    if (cached) {
      setPermissions(cached.permissions);
      setRole(cached.role);
      setCustomRoleName(cached.customRoleName);
      setIsFullAccess(cached.isFullAccess);
      setLoading(false);
    } else if (initialCacheRef.current && initialCacheRef.current.userId !== user.id) {
      // Cache was for different user, clear it
      setPermissions([]);
      setRole(null);
      setCustomRoleName(null);
      setIsFullAccess(false);
      clearPermissionsCache();
    }

    // Create new abort controller and increment request ID
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;

    try {
      // Only show loading if we don't have cached data
      if (!cached) {
        setLoading(true);
      }
      setError(null);

      const res = await fetch('/api/permissions/me', {
        signal: abortController.signal,
      });

      // Check if this request is still the latest one
      if (currentRequestId !== requestIdRef.current) {
        return; // Stale request, ignore response
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch permissions');
      }

      const newPermissions = data.permissions || [];
      const newRole = data.role || null;
      const newCustomRoleName = data.customRoleName || null;
      const newIsFullAccess = data.isFullAccess || false;

      setPermissions(newPermissions);
      setRole(newRole);
      setCustomRoleName(newCustomRoleName);
      setIsFullAccess(newIsFullAccess);

      // Cache for next time
      setCachedPermissions({
        userId: user.id,
        permissions: newPermissions,
        role: newRole,
        customRoleName: newCustomRoleName,
        isFullAccess: newIsFullAccess,
      });
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Check if this request is still the latest one
      if (currentRequestId !== requestIdRef.current) {
        return; // Stale request, ignore error
      }

      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      // Security: On error, deny all permissions (unless we have cached data)
      // This prevents unauthorized access if the permissions API is down or compromised.
      if (!cached) {
        setPermissions([]);
        setIsFullAccess(false);
        setRole(profile?.role || null);
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user, profile?.role]);

  // Fetch permissions when user is available
  useEffect(() => {
    // Wait for mount and auth to complete
    if (!hasMounted) return;

    // Wait for auth to complete AND user to be available
    // If auth is done but no user, that means logged out - only then clear
    if (!authLoading && user) {
      fetchPermissions();
    } else if (!authLoading && !user && !initialCacheRef.current) {
      // Auth done, no user, no cache = logged out, clear state
      setPermissions([]);
      setRole(null);
      setCustomRoleName(null);
      setIsFullAccess(false);
      setLoading(false);
    }
    // If we have cache and no user yet, keep showing cached data

    // Cleanup: abort any in-flight request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, user?.id, fetchPermissions, hasMounted]);

  const hasPermission = useCallback(
    (permission: PermissionId | string): boolean => {
      if (isFullAccess) return true;
      return permissions.includes(permission);
    },
    [permissions, isFullAccess]
  );

  const hasAnyPermission = useCallback(
    (perms: (PermissionId | string)[]): boolean => {
      if (isFullAccess) return true;
      return perms.some(p => permissions.includes(p));
    },
    [permissions, isFullAccess]
  );

  const hasAllPermissions = useCallback(
    (perms: (PermissionId | string)[]): boolean => {
      if (isFullAccess) return true;
      return perms.every(p => permissions.includes(p));
    },
    [permissions, isFullAccess]
  );

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        role,
        customRoleName,
        isFullAccess,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);
