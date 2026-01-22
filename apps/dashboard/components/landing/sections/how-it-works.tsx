import { Code, MousePointerClick, Inbox } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Code,
    title: 'Add one script tag',
    description:
      'Copy and paste a single line of code into your app. Works with any framework or vanilla HTML.',
    code: '<script src="https://cdn.zapbolt.io/widget.js?projectId=YOUR_PROJECT_ID"></script>',
  },
  {
    number: '2',
    icon: MousePointerClick,
    title: 'Users click to report',
    description:
      'A floating button appears in your app. Users click it to submit bugs, features, or suggestions.',
  },
  {
    number: '3',
    icon: Inbox,
    title: 'Get visual feedback',
    description:
      'Receive feedback with screenshots, session replays, and full technical context. Ready to act on.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-y bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            How It Works
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Up and running in 5 minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No complex setup. No configuration headaches. Just copy, paste, and start collecting
            feedback.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-indigo-300 to-indigo-100 md:block" />
              )}

              <div className="relative rounded-xl border bg-card p-6 shadow-sm">
                {/* Step number */}
                <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white shadow-lg">
                  {step.number}
                </div>

                <div className="mt-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                    <step.icon className="h-6 w-6 text-indigo-600" />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>

                  {step.code && (
                    <div className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-3">
                      <code className="text-xs text-slate-300">{step.code}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
