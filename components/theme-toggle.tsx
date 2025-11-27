'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
  className?: string;
}

export function ThemeToggle({ variant = 'switch', className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'inline-flex items-center justify-center rounded-md border px-2 py-2 text-sm hover:bg-muted transition-colors',
          className
        )}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Switch
        id="theme-mode"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
      <label htmlFor="theme-mode" className="text-sm cursor-pointer select-none">
        {isDark ? 'Dark mode' : 'Light mode'}
      </label>
    </div>
  );
}
