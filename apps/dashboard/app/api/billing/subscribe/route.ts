import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { z } from 'zod';

const subscribeSchema = z.object({
  tier: z.enum(['pro', 'enterprise']),
});

// POST /api/billing/subscribe - Create Checkout Session for subscription
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

    const body = await request.json();
    const { tier } = subscribeSchema.parse(body);

    const supabase = await createServerClient();

    // Get user profile to check for existing Stripe customer
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    const profile = userProfile as { stripe_customer_id: string | null; email: string } | null;
    let customerId = profile?.stripe_customer_id;

    // Verify existing customer exists in Stripe, create if not
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        // Customer doesn't exist (e.g., different Stripe mode), clear it
        customerId = null;
      }
    }

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get price ID for the selected plan
    const priceId = STRIPE_PRICES[tier as 'pro' | 'enterprise'];

    if (!priceId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PRICE', message: 'Invalid plan configuration' } },
        { status: 400 }
      );
    }

    // Create Checkout Session with redirect mode
    // This handles all payment complexity including the subscription lifecycle
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/checkout?tier=${tier}&canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier,
        },
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      url: session.url,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to create checkout session' } },
      { status: 500 }
    );
  }
}
