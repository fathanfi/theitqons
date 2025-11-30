import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This API route syncs teacher password with Supabase Auth
// It's called when a teacher's password is updated

export async function POST(request: Request) {
  try {
    const { email, password, oldEmail } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If service role key is not available, return success anyway
    // The login flow will handle creating/updating the auth user
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL not configured');
      return NextResponse.json({ 
        success: true, 
        message: 'Sync skipped - will be handled on login' 
      });
    }

    if (!supabaseServiceKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - sync will be handled on login');
      return NextResponse.json({ 
        success: true, 
        message: 'Sync skipped - service role key not available. Login will handle auth sync.' 
      });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    try {
      // Try to find existing auth user
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        // Return success anyway - login will handle it
        return NextResponse.json({ 
          success: true, 
          message: 'Could not list users, but login will handle auth sync' 
        });
      }

      const existingUser = users?.find(u => u.email === email || (oldEmail && u.email === oldEmail));

      if (existingUser) {
        // Update existing user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { 
            password: password,
            email: email !== oldEmail ? email : undefined
          }
        );

        if (updateError) {
          console.error('Error updating user:', updateError);
          // Return 200 but indicate sync failed - login will handle retry
          return NextResponse.json({ 
            success: false, 
            message: 'Could not update auth user via API - login will retry',
            error: updateError.message,
            retryOnLogin: true
          }, { status: 200 }); // Return 200 so it doesn't block
        }

        return NextResponse.json({ success: true, message: 'Auth user password updated successfully' });
      } else {
        // User doesn't exist in auth - this is okay, login will create it
        return NextResponse.json({ 
          success: true, 
          message: 'Auth user will be created on next login' 
        });
      }
    } catch (adminError: any) {
      console.error('Admin API error:', adminError);
      // Return success anyway - don't block the update
      return NextResponse.json({ 
        success: false, 
        message: 'Admin API unavailable, but login will handle auth sync',
        error: adminError?.message 
      });
    }
  } catch (error: any) {
    console.error('Error syncing auth:', error);
    // Don't fail completely - return a response that indicates sync should happen on login
    return NextResponse.json({ 
      success: false,
      message: 'Sync failed, but login will handle authentication',
      error: error?.message || 'Unknown error'
    });
  }
}

