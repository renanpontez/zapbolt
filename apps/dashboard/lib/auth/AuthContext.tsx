'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/database.types';
import type { OnboardingSteps } from '@zapbolt/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  onboardingCompletedAt: string | null;
  onboardingSteps: OnboardingSteps | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: AuthUser | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const fetchUserProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, tier, onboarding_completed_at, onboarding_steps')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    // Type assertion for query result
    const userData = data as unknown as Tables<'users'>;

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url,
      tier: userData.tier,
      onboardingCompletedAt: userData.onboarding_completed_at,
      onboardingSteps: userData.onboarding_steps as OnboardingSteps | null,
    };
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const profile = await fetchUserProfile(authUser.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  }, [supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user?: { id: string } } | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isUnauthenticated: !user && !isLoading,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
