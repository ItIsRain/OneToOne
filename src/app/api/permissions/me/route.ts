import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ALL_PERMISSION_IDS, DEFAULT_MEMBER_PERMISSIONS } from '@/lib/permissions';
import { getUserIdFromRequest } from '@/hooks/useTenantFromHeaders';

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

/**
 * GET /api/permissions/me
 *
 * Returns the current user's permissions based on their role.
 * - owner/admin: ALL permissions
 * - member with custom_role_id: permissions from that role
 * - member without custom role: default limited permissions
 */
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's profile with role and custom_role_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, custom_role_id, tenant_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { role, custom_role_id, tenant_id } = profile;

    // Owner and admin get all permissions
    if (role === 'owner' || role === 'admin') {
      return NextResponse.json({
        permissions: ALL_PERMISSION_IDS,
        role,
        isFullAccess: true,
      });
    }

    // Member with custom role - fetch permissions from role
    if (custom_role_id) {
      const { data: customRole, error: roleError } = await supabase
        .from('roles')
        .select('permissions, name')
        .eq('id', custom_role_id)
        .eq('tenant_id', tenant_id)
        .single();

      if (!roleError && customRole?.permissions) {
        // permissions is stored as JSONB array
        const permissions = Array.isArray(customRole.permissions)
          ? customRole.permissions
          : [];

        return NextResponse.json({
          permissions,
          role,
          customRoleName: customRole.name,
          isFullAccess: false,
        });
      }
    }

    // Member without custom role - default limited permissions
    return NextResponse.json({
      permissions: DEFAULT_MEMBER_PERMISSIONS,
      role,
      isFullAccess: false,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
