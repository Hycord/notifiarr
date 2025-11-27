'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InlineMultiSelectProps {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (value: string[]) => void;
  triggerText?: (count: number) => string;
  placeholder?: string;
  className?: string;
}

export function InlineMultiSelect({
  value,
  options,
  onChange,
  triggerText = (count) => `${count} selected`,
  placeholder = 'Select items',
  className,
}: InlineMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(value);

  // Sync internal state with prop changes
  useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleToggle = (optionValue: string) => {
    const newSelected = selected.includes(optionValue)
      ? selected.filter(v => v !== optionValue)
      : [...selected, optionValue];
    setSelected(newSelected);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Sync selected state with current value when opening
      setSelected(value);
    } else if (JSON.stringify(selected) !== JSON.stringify(value)) {
      // Save changes when closing if there are changes
      onChange(selected);
    }
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-auto py-1 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted',
            className
          )}
        >
          {selected.length > 0 ? triggerText(selected.length) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-2" align="start">
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2 text-center">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted',
                    isSelected && 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
