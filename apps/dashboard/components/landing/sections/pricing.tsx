import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Perfect for side projects and small teams getting started.',
    features: [
      '50 submissions per month',
      '1 project',
      'Screenshot capture',
      'Basic dashboard',
      'Email support',
    ],
    cta: 'Get Started',
    ctaLink: '/signup',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For growing teams that need more power and integrations.',
    features: [
      'Unlimited submissions',
      '3 projects',
      'Screenshot capture',
      'Session replays (60s)',
      'Slack integration',
      'Priority support',
      'Export to CSV',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: '/mo',
    description: 'For larger teams with advanced needs and custom requirements.',
    features: [
      'Unlimited submissions',
      'Unlimited projects',
      'Session replays (5 min)',
      'Custom branding',
      'API access',
      'SSO / SAML',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={cn(
                'relative rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg',
                tier.popular && 'border-indigo-500 shadow-lg shadow-indigo-500/10'
              )}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <ul className="mt-8 space-y-4">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Check className="h-3 w-3 text-indigo-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  variant={tier.popular ? 'default' : 'outline'}
                  className={cn('w-full', tier.popular && 'shadow-lg')}
                  asChild
                >
                  <Link href={tier.ctaLink}>{tier.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          14-day money-back guarantee. Cancel anytime, no questions asked.
        </p>
      </div>
    </section>
  );
}
