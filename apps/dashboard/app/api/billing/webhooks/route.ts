import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';
import type { Tier } from '@zapbolt/shared';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function updateUserTier(userId: string, tier: Tier, subscriptionId: string | null | undefined) {
  const supabase = await createServerClient();

  console.log('[Stripe Webhook] Updating user tier in DB:', { userId, tier, subscriptionId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { tier };
  if (subscriptionId !== undefined) {
    updateData.stripe_subscription_id = subscriptionId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update user tier:', error);
    throw error;
  }

  console.log('[Stripe Webhook] Successfully updated user tier');
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  const profile = data as { id: string } | null;
  return profile?.id || null;
}

function getTierFromPriceId(priceId: string): Tier {
  const proPriceId = process.env.STRIPE_PRICE_PRO;
  const enterprisePriceId = process.env.STRIPE_PRICE_BUSINESS;

  if (priceId === proPriceId) return 'pro';
  if (priceId === enterprisePriceId) return 'enterprise';
  return 'free';
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`, { id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('[Stripe Webhook] checkout.session.completed:', {
          sessionId: session.id,
          metadata: session.metadata,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        // Get user ID from session metadata
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier as Tier;

        if (userId && tier) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          await updateUserTier(userId, tier, subscriptionId);
          console.log(`[Stripe Webhook] Activated ${tier} subscription for user ${userId}`);
        } else {
          console.error('[Stripe Webhook] Missing required metadata:', { userId, tier });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) {
          console.error('User not found for customer:', customerId);
          break;
        }

        // Check if subscription is active
        if (subscription.status === 'active') {
          const priceId = subscription.items.data[0]?.price.id;
          if (priceId) {
            const tier = getTierFromPriceId(priceId);
            await updateUserTier(userId, tier, subscription.id);
            console.log(`Updated subscription to ${tier} for user ${userId}`);
          }
        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
          // Don't immediately downgrade for past_due - wait for deletion
          if (subscription.status === 'canceled') {
            await updateUserTier(userId, 'free', null);
            console.log(`Subscription canceled for user ${userId}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const userId = await getUserIdFromCustomer(customerId);
        if (userId) {
          await updateUserTier(userId, 'free', null);
          console.log(`Downgraded to free tier for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (customerId) {
          const userId = await getUserIdFromCustomer(customerId);
          if (userId) {
            // Log payment failure - could send notification email here
            console.warn(`Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
