'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface SystemStatusBadgeProps {
  isRunning: boolean;
  dataUpdatedAt?: number;
  className?: string;
}

export function SystemStatusBadge({
  isRunning,
  dataUpdatedAt,
  className,
}: SystemStatusBadgeProps) {
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    if (isRunning && dataUpdatedAt) {
      setIsPinging(true);
      const timer = setTimeout(() => setIsPinging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [dataUpdatedAt, isRunning]);

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-sm px-3 py-1 flex items-center h-6',
        isRunning
          ? 'border-green-500 text-green-500'
          : 'border-muted-foreground/50 text-muted-foreground',
        className
      )}
    >
      <div
        className={cn(
          'h-2 w-2 rounded-full mr-2 transition-all duration-300',
          isRunning ? 'bg-green-500' : 'bg-muted-foreground',
          isPinging && 'scale-150 opacity-50'
        )}
      />
      {isRunning ? 'Running' : 'Stopped'}
    </Badge>
  );
}
