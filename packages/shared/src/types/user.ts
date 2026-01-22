import type { Tier } from '../constants/tier-limits';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  tier: Tier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateInput {
  name?: string;
  avatarUrl?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpInput extends AuthCredentials {
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
