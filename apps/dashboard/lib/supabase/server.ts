import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import type { User } from '@supabase/supabase-js';

type CookieToSet = { name: string; value: string; options: CookieOptions };
type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient<Database>>;

export async function createServerClient(): Promise<SupabaseServerClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  // During build time, env vars may not be available
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component - ignore
        }
      },
    },
  });
}

export async function createAuthClient(): Promise<SupabaseServerClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // During build time, env vars may not be available
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component - ignore
        }
      },
    },
  });
}

/**
 * Ensures a user profile exists in the users table.
 * This handles the case where the trigger didn't fire or the user was created
 * before the trigger was set up.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const supabase = await createServerClient();

  // Check if user profile exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingUser) {
    // Create the user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors (race condition)
      console.error('Failed to create user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }
}
