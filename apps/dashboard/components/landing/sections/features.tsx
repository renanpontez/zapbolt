import { Camera, Info, Video, LayoutDashboard } from 'lucide-react';

const features = [
  {
    icon: Camera,
    title: 'Screenshots',
    description:
      'Users capture exactly what they see with one click. Annotate and highlight the problem area.',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Info,
    title: 'Auto-context',
    description:
      'Browser, URL, viewport, and device info captured automatically. No more "what browser are you using?"',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    icon: Video,
    title: 'Session Replay',
    description:
      'See the last 60 seconds of what users did. Understand the full context without asking.',
    gradient: 'from-amber-500 to-amber-600',
    badge: 'Pro',
  },
  {
    icon: LayoutDashboard,
    title: 'One Dashboard',
    description:
      'All feedback in one place. Filter by type, status, project. Never lose track of user input again.',
    gradient: 'from-emerald-500 to-emerald-600',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Context with every submission
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop asking users for more details. Get everything you need to understand and reproduce
            issues instantly.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg"
            >
              {/* Background gradient on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-5`}
              />

              <div className="relative">
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  {feature.badge && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {feature.badge}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
