import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

// POST /api/billing/portal - Create customer portal session
export async function POST(request: Request) {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if this is a cancellation request
    let flow: 'cancel' | null = null;
    try {
      const body = await request.json();
      flow = body.flow || null;
    } catch {
      // No body or invalid JSON, that's fine
    }

    const supabase = await createServerClient();

    // Get user's Stripe customer ID and subscription ID
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single() as { data: { stripe_customer_id: string | null; stripe_subscription_id: string | null } | null };

    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' } },
        { status: 400 }
      );
    }

    // Build portal session options
    const sessionOptions: Stripe.BillingPortal.SessionCreateParams = {
      customer: userProfile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    };

    // If cancellation flow requested and we have a subscription, go directly to cancel
    if (flow === 'cancel' && userProfile.stripe_subscription_id) {
      sessionOptions.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: userProfile.stripe_subscription_id,
        },
      };
    }

    const session = await stripe.billingPortal.sessions.create(sessionOptions);

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
