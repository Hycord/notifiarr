'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
            onError: (error: Error) => {
              console.error('[Mutation Error]', error);
              toast.error(error.message || 'An error occurred');
            },
          },
        },
        queryCache: undefined,
      })
  );

  // Suppress benign Monaco clipboard permission errors in dev overlay
  useEffect(() => {
    const originalError = console.error;
    const patchedError = (...args: unknown[]) => {
      try {
        const stringify = (v: unknown) => {
          if (typeof v === 'string') return v;
          if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack || ''}`;
          return '';
        };
        const combined = args.map(stringify).join('\n');
        const isMonacoNotAllowed =
          combined.includes('NotAllowedError') &&
          (combined.includes('monaco-editor') || combined.includes('vs/editor'));
        if (isMonacoNotAllowed) {
          // Ignore this specific noisy error; it's typically a clipboard permission check.
          return;
        }
      } catch {
        // If filtering fails, fall back to original behavior.
      }
      // Forward all other errors
      originalError(...args);
    };

    console.error = patchedError;
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
