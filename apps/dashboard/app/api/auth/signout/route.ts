import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: 'SIGNOUT_FAILED', message: 'Failed to sign out' } },
      { status: 500 }
    );
  }
}
