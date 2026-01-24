'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Check, Zap, Building, Loader2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIER_LIMITS, TIER_PRICES, type Tier } from '@zapbolt/shared';

const plans: {
  name: string;
  tier: Tier;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}[] = [
  {
    name: 'Free',
    tier: 'free',
    description: 'Perfect for getting started',
    icon: Zap,
    features: [
      '1 project',
      '50 feedback/month',
      'Screenshot capture',
      '30-day data retention',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    tier: 'pro',
    description: 'For growing teams',
    icon: Zap,
    features: [
      '10 projects',
      '1,000 feedback/month',
      'Session replay',
      'Custom branding',
      'Webhooks & API access',
      '1-year data retention',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'For large organizations',
    icon: Building,
    features: [
      'Unlimited projects',
      'Unlimited feedback',
      'Extended session replay',
      'SSO integration',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
    ],
  },
];

function BillingContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const currentTier = user?.tier || 'free';

  // Handle return from checkout with success
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setCheckoutSuccess(true);
      // Small delay to allow webhook to process before refreshing user
      const timer = setTimeout(() => {
        refreshUser?.();
      }, 1500);
      // Clean up URL
      router.replace('/billing', { scroll: false });
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, refreshUser]);

  const handleUpgrade = (tier: Tier) => {
    if (tier === 'free' || tier === currentTier) return;

    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@zapbolt.io?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    router.push(`/billing/checkout?tier=${tier}`);
  };

  const handleDowngrade = async () => {
    setLoading('downgrade');
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'cancel' }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open cancellation portal:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('portal');
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/billing/status');
      const data = await response.json();
      setBillingStatus(data);
      console.log('Billing status:', data);
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSyncFromStripe = async () => {
    setLoading('sync');
    try {
      const response = await fetch('/api/billing/sync', { method: 'POST' });
      const data = await response.json();
      console.log('Sync result:', data);
      if (data.synced) {
        refreshUser?.();
        handleCheckStatus();
      }
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {checkoutSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Your subscription has been activated. Thank you for subscribing!
          </p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-semibold capitalize">{currentTier}</span> plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {TIER_LIMITS[currentTier].maxProjects === -1
                  ? 'Unlimited projects'
                  : `${TIER_LIMITS[currentTier].maxProjects} project${TIER_LIMITS[currentTier].maxProjects > 1 ? 's' : ''}`}
                {' - '}
                {TIER_LIMITS[currentTier].maxFeedbackPerMonth === -1
                  ? 'Unlimited feedback'
                  : `${TIER_LIMITS[currentTier].maxFeedbackPerMonth} feedback/month`}
              </p>
            </div>
            {currentTier !== 'free' && (
              <Button variant="outline" onClick={handleManageBilling} disabled={loading === 'portal'}>
                {loading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug: Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subscription Debug</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckStatus}
                disabled={statusLoading}
              >
                {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncFromStripe}
                disabled={loading === 'sync'}
              >
                {loading === 'sync' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sync from Stripe
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Debug info for troubleshooting subscription issues
          </CardDescription>
        </CardHeader>
        {billingStatus && (
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(billingStatus, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.tier === currentTier;
          const price = TIER_PRICES[plan.tier];

          return (
            <Card
              key={plan.tier}
              className={isCurrentPlan ? 'border-primary' : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <plan.icon className="h-5 w-5" />
                    {plan.name}
                  </CardTitle>
                  {isCurrentPlan && <Badge>Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">
                    ${price.monthly}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.tier === 'enterprise' ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpgrade('enterprise')}
                  >
                    Contact Sales
                  </Button>
                ) : plan.tier === 'free' && currentTier !== 'free' ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleDowngrade}
                    disabled={loading === 'downgrade'}
                  >
                    {loading === 'downgrade' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    Upgrade
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingContent />
    </Suspense>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
