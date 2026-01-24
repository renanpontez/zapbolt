import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from database
    const { data: profile } = await supabase
      .from('users')
      .select('tier, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single() as { data: { tier: string; stripe_customer_id: string | null; stripe_subscription_id: string | null } | null };

    console.log('[Billing Status] Database profile:', profile);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stripeSubscriptions: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stripeCustomer: any = null;

    // If user has a Stripe customer ID, fetch their subscriptions
    if (profile?.stripe_customer_id) {
      try {
        stripeCustomer = await stripe.customers.retrieve(profile.stripe_customer_id);
        console.log('[Billing Status] Stripe customer:', stripeCustomer);

        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 10,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stripeSubscriptions = subs.data.map((sub: any) => ({
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          items: sub.items?.data?.map((item: any) => ({
            price_id: item.price?.id,
            product_id: typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id,
          })),
        }));
        console.log('[Billing Status] Stripe subscriptions:', stripeSubscriptions);
      } catch (err) {
        console.error('[Billing Status] Error fetching from Stripe:', err);
      }
    }

    // Also check recent checkout sessions for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recentCheckoutSessions: any[] = [];
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
      });

      // Filter for sessions that match this user
      recentCheckoutSessions = sessions.data
        .filter(s => s.metadata?.supabase_user_id === user.id)
        .map(s => ({
          id: s.id,
          status: s.status,
          payment_status: s.payment_status,
          metadata: s.metadata,
          customer: s.customer,
          subscription: s.subscription,
          created: new Date(s.created * 1000).toISOString(),
        }));
      console.log('[Billing Status] Recent checkout sessions for user:', recentCheckoutSessions);
    } catch (err) {
      console.error('[Billing Status] Error fetching checkout sessions:', err);
    }

    return NextResponse.json({
      user_id: user.id,
      database: {
        tier: profile?.tier || 'free',
        stripe_customer_id: profile?.stripe_customer_id || null,
        stripe_subscription_id: profile?.stripe_subscription_id || null,
      },
      stripe: {
        customer: stripeCustomer ? {
          id: stripeCustomer.id,
          email: stripeCustomer.email,
        } : null,
        subscriptions: stripeSubscriptions,
        recent_checkout_sessions: recentCheckoutSessions,
      },
    });
  } catch (error) {
    console.error('[Billing Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing status' },
      { status: 500 }
    );
  }
}
