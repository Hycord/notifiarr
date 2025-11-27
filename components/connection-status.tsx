'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  dataUpdatedAt: number;
  onlineText?: string;
  offlineText?: string;
  showText?: boolean;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  dataUpdatedAt,
  onlineText = 'Connected',
  offlineText = 'Disconnected',
  showText = true,
  className,
}: ConnectionStatusProps) {
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsPinging(true);
      const timer = setTimeout(() => setIsPinging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [dataUpdatedAt, isConnected]);

  if (showText) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'text-sm px-3 py-1 flex items-center',
          isConnected
            ? 'border-green-500 text-green-500'
            : 'border-red-500 text-red-500',
          className
        )}
      >
        <div
          className={cn(
            'h-2 w-2 rounded-full mr-2 transition-all duration-300',
            isConnected ? 'bg-green-500' : 'bg-red-500',
            isPinging && 'scale-150 opacity-50'
          )}
        />
        {isConnected ? onlineText : offlineText}
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        'h-3 w-3 rounded-full transition-all duration-300',
        isConnected ? 'bg-green-500' : 'bg-red-500',
        isPinging && 'scale-150 opacity-50',
        className
      )}
    />
  );
}
