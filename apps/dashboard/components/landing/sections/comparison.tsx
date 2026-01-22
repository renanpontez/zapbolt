import { Check, X, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  zapbolt: string | boolean;
  userback: string | boolean;
  canny: string | boolean;
  hotjar: string | boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Starting Price',
    zapbolt: 'Free',
    userback: '$49/mo',
    canny: '$79/mo',
    hotjar: '$32/mo',
  },
  {
    feature: 'Setup Time',
    zapbolt: '5 min',
    userback: '30 min',
    canny: '45 min',
    hotjar: '20 min',
  },
  {
    feature: 'Screenshot Capture',
    zapbolt: true,
    userback: true,
    canny: false,
    hotjar: false,
  },
  {
    feature: 'Session Replay',
    zapbolt: true,
    userback: false,
    canny: false,
    hotjar: true,
  },
  {
    feature: 'Free Tier',
    zapbolt: true,
    userback: false,
    canny: false,
    hotjar: true,
  },
  {
    feature: 'One-line Install',
    zapbolt: true,
    userback: true,
    canny: false,
    hotjar: true,
  },
  {
    feature: 'Auto Context Capture',
    zapbolt: true,
    userback: true,
    canny: false,
    hotjar: false,
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
        <Check className="h-4 w-4 text-green-600" />
      </div>
    ) : (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
        <X className="h-4 w-4 text-red-500" />
      </div>
    );
  }

  if (value === '-') {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="border-y bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Compare
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why teams switch to Zapbolt
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            More features, better pricing, faster setup. See how we stack up against alternatives.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border-b p-4 text-left text-sm font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="border-b bg-indigo-50 p-4 text-center">
                  <div className="text-sm font-semibold text-indigo-700">Zapbolt</div>
                </th>
                <th className="border-b p-4 text-center text-sm font-medium text-muted-foreground">
                  Userback
                </th>
                <th className="border-b p-4 text-center text-sm font-medium text-muted-foreground">
                  Canny
                </th>
                <th className="border-b p-4 text-center text-sm font-medium text-muted-foreground">
                  Hotjar
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index}>
                  <td className="border-b p-4 text-sm text-foreground">{row.feature}</td>
                  <td className="border-b bg-indigo-50/50 p-4">
                    <div className="flex justify-center">
                      <CellValue value={row.zapbolt} />
                    </div>
                  </td>
                  <td className="border-b p-4">
                    <div className="flex justify-center">
                      <CellValue value={row.userback} />
                    </div>
                  </td>
                  <td className="border-b p-4">
                    <div className="flex justify-center">
                      <CellValue value={row.canny} />
                    </div>
                  </td>
                  <td className="border-b p-4">
                    <div className="flex justify-center">
                      <CellValue value={row.hotjar} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Comparison based on publicly available pricing and feature information as of 2024.
        </p>
      </div>
    </section>
  );
}
