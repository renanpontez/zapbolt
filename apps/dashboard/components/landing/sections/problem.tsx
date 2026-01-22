import { AlertCircle, ImageOff, MessageSquareOff } from 'lucide-react';

const painPoints = [
  {
    icon: AlertCircle,
    title: '"It\'s broken"',
    description: 'But where? What browser? What were they doing? You waste hours playing detective.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: ImageOff,
    title: 'Screenshots in email',
    description:
      "Blurry screenshots with no context. Can't reproduce. Back and forth asking for details.",
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    icon: MessageSquareOff,
    title: 'Feature requests in Slack',
    description:
      'Great ideas scattered across channels. No way to track, prioritize, or follow up.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
];

export function ProblemSection() {
  return (
    <section className="border-y bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bug reports shouldn&apos;t require{' '}
            <span className="text-muted-foreground">detective work</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sound familiar? You&apos;re not alone. Teams waste countless hours on feedback that
            lacks context.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="relative rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${point.bgColor}`}
              >
                <point.icon className={`h-6 w-6 ${point.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{point.title}</h3>
              <p className="mt-2 text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
