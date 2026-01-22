import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import type { AuthUser } from './AuthContext';
import type { Tables } from '@/lib/supabase/database.types';
import type { OnboardingSteps } from '@zapbolt/shared';

export async function getServerUser(): Promise<AuthUser | null> {
  // Return null during build time when env vars are not available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }

  try {
    const authClient = await createAuthClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const supabase = await createServerClient();
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, tier, onboarding_completed_at, onboarding_steps')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profileData) {
      // User exists in auth but not in users table yet (trigger may not have run)
      // Return minimal user info
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        tier: 'free',
        onboardingCompletedAt: null,
        onboardingSteps: null,
      };
    }

    // Type assertion for query result
    const profile = profileData as unknown as Tables<'users'>;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      tier: profile.tier,
      onboardingCompletedAt: profile.onboarding_completed_at,
      onboardingSteps: profile.onboarding_steps as OnboardingSteps | null,
    };
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}
