import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500 to-indigo-700" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V0h32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative elements */}
      <div className="absolute left-10 top-10 h-20 w-20 rounded-full bg-amber-400/20 blur-xl" />
      <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />

      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Zap className="h-8 w-8 text-amber-300" fill="currentColor" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Start collecting better feedback today
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg text-indigo-100">
            Join thousands of teams using Zapbolt to understand their users better. Set up in 5
            minutes, see results immediately.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="h-12 bg-white px-8 text-base text-indigo-600 hover:bg-white/90"
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
            >
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-indigo-200">No credit card required. Free forever plan available.</p>
        </div>
      </div>
    </section>
  );
}
