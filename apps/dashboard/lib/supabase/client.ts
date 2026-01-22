import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // During build time, env vars may not be available
  // Return a mock client that will be replaced at runtime
  if (!url || !key) {
    // This should only happen during static build
    // The real client will be created on the client side
    return null as unknown as SupabaseClient;
  }

  client = createBrowserClient<Database>(url, key);

  return client;
}
