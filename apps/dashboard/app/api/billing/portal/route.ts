import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/billing/portal - Create customer portal session
export async function POST() {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const profile = userProfile as { stripe_customer_id: string | null } | null;

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' } },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to create portal session' } },
      { status: 500 }
    );
  }
}
