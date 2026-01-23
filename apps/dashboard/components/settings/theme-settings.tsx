'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const themes = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how the dashboard looks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              onClick={() => setTheme(value)}
              className="flex-1"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
