'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

export interface KeyValueEditorProps {
  label?: string;
  value?: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  placeholderKey?: string;
  placeholderValue?: string;
  allowedKeys?: string[]; // If provided, only these keys can be added
  // Controls how the value input is parsed
  // - 'auto' (default): try JSON.parse; fall back to string
  // - 'string': always keep as string
  // - 'object-or-string': parse to object only if value looks like a JSON object; else keep string
  valueParser?: 'auto' | 'string' | 'object-or-string';
}

export function KeyValueEditor({
  label,
  value,
  onChange,
  placeholderKey = 'key',
  placeholderValue = 'value',
  allowedKeys,
  valueParser = 'auto',
}: KeyValueEditorProps) {
  const entries = React.useMemo(() => Object.entries(value ?? {}), [value]);

  function updateAt(idx: number, k: string, v: string) {
    const copy = Object.fromEntries(entries);
    const originalKey = entries[idx]?.[0];
    if (originalKey && originalKey !== k) delete (copy as any)[originalKey];
    const trimmed = (v ?? '').trim();
    if (valueParser === 'string') {
      (copy as any)[k] = v;
    } else if (valueParser === 'object-or-string') {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          (copy as any)[k] = JSON.parse(trimmed);
        } catch {
          (copy as any)[k] = v;
        }
      } else {
        (copy as any)[k] = v;
      }
    } else {
      // auto
      try {
        (copy as any)[k] = v === '' ? '' : JSON.parse(v);
      } catch {
        (copy as any)[k] = v;
      }
    }
    onChange(copy);
  }

  function removeAt(idx: number) {
    const copy = Object.fromEntries(entries);
    delete (copy as any)[entries[idx][0]];
    onChange(copy);
  }

  function addEntry() {
    const copy = Object.fromEntries(entries);
    let k = 'key';
    
    if (allowedKeys && allowedKeys.length > 0) {
      // Find first allowed key that isn't already used
      const usedKeys = new Set(Object.keys(copy));
      const availableKey = allowedKeys.find(key => !usedKeys.has(key));
      if (availableKey) {
        k = availableKey;
      } else {
        // All allowed keys are used
        return;
      }
    } else {
      // Default behavior
      let i = 1;
      while ((copy as any)[k]) {
        k = `key_${i++}`;
      }
    }
    
    (copy as any)[k] = '';
    onChange(copy);
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries</p>
        )}
        {entries.map(([k, v], idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`key-${idx}`} className="text-xs">Key</Label>
                {allowedKeys && allowedKeys.length > 0 ? (
                  <select
                    id={`key-${idx}`}
                    className="w-full font-mono text-sm h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={k}
                    onChange={(e) => updateAt(idx, e.target.value, JSON.stringify(v))}
                  >
                    {allowedKeys.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`key-${idx}`}
                    className="font-mono text-sm"
                    value={k}
                    onChange={(e) => updateAt(idx, e.target.value, JSON.stringify(v))}
                    placeholder={placeholderKey}
                  />
                )}
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 shrink-0" 
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${k}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2" style={{paddingRight: '3rem'}}>
              <Label htmlFor={`value-${idx}`} className="text-xs">Value</Label>
              <Input
                id={`value-${idx}`}
                className="font-mono text-sm"
                value={typeof v === 'string' ? v : JSON.stringify(v)}
                onChange={(e) => updateAt(idx, k, e.target.value)}
                placeholder={placeholderValue}
              />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="h-4 w-4 mr-2" /> Add
      </Button>
    </div>
  );
}

export interface StringArrayEditorProps {
  label?: string;
  value?: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function StringArrayEditor({ label, value, onChange, placeholder }: StringArrayEditorProps) {
  const items = value ?? [];

  function updateAt(idx: number, v: string) {
    const next = items.slice();
    next[idx] = v;
    onChange(next);
  }

  function removeAt(idx: number) {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  }

  function addItem() {
    onChange([...(items || []), '']);
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="space-y-2">
        {(items || []).length === 0 && (
          <p className="text-sm text-muted-foreground">No items</p>
        )}
        {(items || []).map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              className="font-mono"
              value={v}
              onChange={(e) => updateAt(idx, e.target.value)}
              placeholder={placeholder}
            />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeAt(idx)} aria-label={`Remove item ${idx + 1}`}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" /> Add
      </Button>
    </div>
  );
}
