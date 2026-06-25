import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthRoleFromTeacherRoles } from '@/lib/teacherRoles';

export async function POST(request: Request) {
  try {
    const { email, roles, username } = await request.json();

    if (!email || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: 'Email and roles are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: true,
        message: 'Role sync skipped - will be applied on next login',
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authRole = resolveAuthRoleFromTeacherRoles(roles, username);

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({
        success: false,
        message: 'Could not list users - role will sync on next login',
        error: listError.message,
      });
    }

    const existingUser = users?.find((u) => u.email === email);

    if (!existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Auth user not found - role will be applied on first login',
      });
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: existingUser.id, role: authRole }, { onConflict: 'user_id' });

    if (roleError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update user role',
        error: roleError.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${authRole}`,
      role: authRole,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: 'Role sync failed - will be applied on next login',
      error: message,
    });
  }
}
