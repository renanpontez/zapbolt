'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Check, Zap, Building, Loader2 } from 'lucide-react';
import { useState } from 'react';

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

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = user?.tier || 'free';

  const handleUpgrade = async (tier: Tier) => {
    if (tier === 'free' || tier === currentTier) return;

    setLoading(tier);
    try {
      if (tier === 'enterprise') {
        window.location.href = 'mailto:sales@zapbolt.io?subject=Enterprise%20Plan%20Inquiry';
        return;
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: 'monthly' }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

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
                    disabled={loading === 'enterprise'}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={loading === plan.tier}
                  >
                    {loading === plan.tier && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {plan.tier === 'free' ? 'Downgrade' : 'Upgrade'}
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
