'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TIER_PRICES, type Tier } from '@zapbolt/shared';

const planFeatures: Record<Exclude<Tier, 'free'>, string[]> = {
  pro: [
    '10 projects',
    '1,000 feedback/month',
    'Session replay',
    'Custom branding',
    'Webhooks & API access',
    '1-year data retention',
    'Priority support',
  ],
  enterprise: [
    'Unlimited projects',
    'Unlimited feedback',
    'Extended session replay',
    'SSO integration',
    'Dedicated support',
    'Custom contracts',
    'SLA guarantee',
  ],
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tierParam = searchParams.get('tier');
  const tier = tierParam === 'pro' || tierParam === 'enterprise' ? tierParam : null;
  const canceled = searchParams.get('canceled') === 'true';

  // Redirect if invalid tier
  useEffect(() => {
    if (!tier) {
      router.replace('/billing');
    }
  }, [tier, router]);

  const handleCheckout = async () => {
    if (!tier) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to initialize checkout');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout');
      setLoading(false);
    }
  };

  if (!tier) {
    return null;
  }

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const price = TIER_PRICES[tier].monthly;
  const features = planFeatures[tier];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscribe to {tierName}</h1>
        <p className="text-muted-foreground">Review your plan and proceed to payment</p>
      </div>

      {canceled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Payment was canceled. You can try again when ready.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review your subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-semibold">{tierName} Plan</p>
              <p className="text-sm text-muted-foreground">Monthly subscription</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${price}</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
          </div>

          <div>
            <p className="mb-3 font-medium">Included features:</p>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between font-semibold">
              <span>Total due today</span>
              <span>${price}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Then ${price}/month starting next billing cycle
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              `Continue to Payment`
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You&apos;ll be redirected to Stripe to complete your payment securely.
            Your subscription will renew automatically each month.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Billing
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
