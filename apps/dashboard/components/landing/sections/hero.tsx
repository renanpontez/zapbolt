import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Now with Session Replay
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Feedback at{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent">
              lightning speed
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Collect bug reports and feature requests with screenshots and session replays. Install
            in 5 minutes with one script tag.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/signup">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 px-8 text-base">
              <a href="#demo">
                <Play className="mr-2 h-4 w-4" />
                See Demo
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free forever. No credit card required.
          </p>
        </div>

        {/* Widget Mockup */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="relative rounded-xl border bg-card p-1 shadow-2xl shadow-indigo-500/10">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 rounded-t-lg border-b bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <div className="mx-auto max-w-md rounded-md bg-background px-4 py-1 text-xs text-muted-foreground">
                  your-app.com
                </div>
              </div>
            </div>

            {/* App Content Mockup */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-b-lg bg-gradient-to-br from-slate-50 to-slate-100">
              {/* Placeholder content */}
              <div className="absolute inset-0 p-6">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="h-24 rounded-lg bg-white shadow-sm" />
                  <div className="h-24 rounded-lg bg-white shadow-sm" />
                  <div className="h-24 rounded-lg bg-white shadow-sm" />
                </div>
                <div className="mt-4 h-48 rounded-lg bg-white shadow-sm" />
              </div>

              {/* Zapbolt Widget Button */}
              <div className="absolute bottom-6 right-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6 text-white"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </div>

              {/* Widget Popup */}
              <div className="absolute bottom-24 right-6 w-80 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3">
                  <h4 className="font-semibold text-white">Send Feedback</h4>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-md border bg-indigo-50 px-3 py-2 text-center text-sm font-medium text-indigo-700">
                      Bug
                    </div>
                    <div className="flex-1 rounded-md border px-3 py-2 text-center text-sm text-muted-foreground">
                      Feature
                    </div>
                    <div className="flex-1 rounded-md border px-3 py-2 text-center text-sm text-muted-foreground">
                      Other
                    </div>
                  </div>
                  <div className="h-20 rounded-md border bg-slate-50" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-5 w-5 rounded bg-slate-200" />
                      Add screenshot
                    </div>
                    <div className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white">
                      Submit
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
