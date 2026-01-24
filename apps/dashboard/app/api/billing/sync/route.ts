import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';
import type { Tier } from '@zapbolt/shared';

function getTierFromPriceId(priceId: string): Tier {
  const proPriceId = process.env.STRIPE_PRICE_PRO;
  const enterprisePriceId = process.env.STRIPE_PRICE_BUSINESS;

  if (priceId === proPriceId) return 'pro';
  if (priceId === enterprisePriceId) return 'enterprise';
  return 'free';
}

export async function POST() {
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

    console.log('[Billing Sync] Current profile:', profile);

    if (!profile?.stripe_customer_id) {
      // Check if there are any checkout sessions for this user
      const sessions = await stripe.checkout.sessions.list({ limit: 50 });
      const userSession = sessions.data.find(
        s => s.metadata?.supabase_user_id === user.id &&
             s.payment_status === 'paid' &&
             s.subscription
      );

      if (userSession) {
        console.log('[Billing Sync] Found completed checkout session:', userSession.id);

        const customerId = typeof userSession.customer === 'string'
          ? userSession.customer
          : userSession.customer?.id;
        const subscriptionId = typeof userSession.subscription === 'string'
          ? userSession.subscription
          : userSession.subscription?.id;
        const tier = userSession.metadata?.tier as Tier;

        if (customerId && tier) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from('users')
            .update({
              tier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', user.id);

          if (error) {
            console.error('[Billing Sync] Failed to update from checkout session:', error);
            return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
          }

          console.log('[Billing Sync] Synced from checkout session:', { tier, customerId, subscriptionId });
          return NextResponse.json({
            synced: true,
            source: 'checkout_session',
            tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          });
        }
      }

      return NextResponse.json({
        synced: false,
        message: 'No Stripe customer found',
      });
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    console.log('[Billing Sync] Active subscriptions:', subscriptions.data.length);

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;
      const tier = priceId ? getTierFromPriceId(priceId) : 'free';

      console.log('[Billing Sync] Syncing to tier:', tier, 'from price:', priceId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('users')
        .update({
          tier,
          stripe_subscription_id: subscription.id,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Billing Sync] Failed to update:', error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
      }

      return NextResponse.json({
        synced: true,
        source: 'stripe_subscription',
        tier,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
      });
    } else {
      // No active subscription - set to free
      console.log('[Billing Sync] No active subscription, setting to free');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('users')
        .update({
          tier: 'free',
          stripe_subscription_id: null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Billing Sync] Failed to update:', error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
      }

      return NextResponse.json({
        synced: true,
        source: 'no_active_subscription',
        tier: 'free',
      });
    }
  } catch (error) {
    console.error('[Billing Sync] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync billing status' },
      { status: 500 }
    );
  }
}
