'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/ui/combobox';
import { StringArrayEditor } from '@/components/forms/key-value-editor';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import type { FilterGroupFormData, FilterConfigFormData } from '@/lib/schemas';

const operators = [
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'matches',
  'notMatches',
  'exists',
  'notExists',
  'in',
  'notIn',
] as const;

export interface FilterBuilderProps {
  value?: FilterGroupFormData;
  onChange: (next?: FilterGroupFormData) => void;
}

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  function initRoot() {
    onChange({ operator: 'AND', filters: [] });
  }

  if (!value) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No filters defined.</p>
        <Button type="button" variant="outline" size="sm" onClick={initRoot}>
          <Plus className="h-4 w-4 mr-2" /> Add Filters
        </Button>
      </div>
    );
  }

  return (
    <FilterGroupEditor value={value} onChange={onChange} depth={0} />
  );
}

function FilterGroupEditor({ value, onChange, depth }: { value: FilterGroupFormData; onChange: (next?: FilterGroupFormData) => void; depth: number; }) {
  const groupOpOptions = [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
  ];

  function updateOperator(op: 'AND' | 'OR') {
    onChange({ ...value, operator: op });
  }

  function addRule() {
    onChange({ ...value, filters: [...value.filters, { field: '', operator: 'equals' }] });
  }

  function addGroup() {
    onChange({ ...value, filters: [...value.filters, { operator: 'AND', filters: [] }] as any });
  }

  function updateAt(idx: number, next: any) {
    const filters = value.filters.slice();
    filters[idx] = next;
    onChange({ ...value, filters });
  }

  function removeAt(idx: number) {
    const filters = value.filters.slice();
    filters.splice(idx, 1);
    if (filters.length === 0 && depth === 0) {
      onChange(undefined);
    } else {
      onChange({ ...value, filters });
    }
  }

  return (
    <Card className="bg-background/40">
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Match condition</Label>
            <Combobox
              options={groupOpOptions}
              value={value.operator}
              onChange={(v) => updateOperator(v as 'AND' | 'OR')}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" size="sm" variant="outline" onClick={addRule} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" /> Add rule
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addGroup} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" /> Add group
            </Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          {value.filters.map((f: any, idx: number) =>
            isGroup(f) ? (
              <div key={`g-${idx}`} className="pl-3 border-l">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4 shrink-0" /> 
                  <span className="flex-1 truncate">Nested group</span>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="shrink-0" 
                    onClick={() => removeAt(idx)}
                    aria-label="Remove nested group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FilterGroupEditor value={f} onChange={(next) => updateAt(idx, next)} depth={depth + 1} />
              </div>
            ) : (
              <FilterRuleEditor
                key={`r-${idx}`}
                value={f}
                onChange={(next) => updateAt(idx, next)}
                onRemove={() => removeAt(idx)}
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterRuleEditor({ value, onChange, onRemove }: { value: Partial<FilterConfigFormData>; onChange: (next: Partial<FilterConfigFormData>) => void; onRemove: () => void; }) {
  const operatorOptions = operators.map((o) => ({ value: o, label: o }));

  return (
    <Card className="bg-muted/50">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-2">
            <Label className="text-xs">Field</Label>
            <Input
              className="font-mono text-sm"
              placeholder="message.content"
              value={value.field || ''}
              onChange={(e) => onChange({ ...value, field: e.target.value })}
            />
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="mt-6 shrink-0" 
            onClick={onRemove}
            aria-label="Remove filter rule"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Operator</Label>
          <Combobox
            options={operatorOptions}
            value={(value.operator as string) || 'equals'}
            onChange={(v) => onChange({ ...value, operator: v as any })}
          />
        </div>

        {showValueInput(value.operator as string) && (
          <div className="space-y-2">
            <Label className="text-xs">Value</Label>
            <Input
              className="font-mono text-sm"
              placeholder="value to match"
              value={typeof value.value === 'string' ? (value.value as string) : ''}
              onChange={(e) => onChange({ ...value, value: e.target.value })}
            />
          </div>
        )}

        {showPatternInput(value.operator as string) && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Regex pattern</Label>
              <Input
                className="font-mono text-sm"
                placeholder="^regex.*pattern$"
                value={value.pattern || ''}
                onChange={(e) => onChange({ ...value, pattern: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Flags</Label>
              <Input
                className="font-mono text-sm w-full sm:w-20"
                placeholder="i"
                value={value.flags || ''}
                onChange={(e) => onChange({ ...value, flags: e.target.value })}
              />
            </div>
          </div>
        )}

        {showArrayInput(value.operator as string) && (
          <div className="space-y-2">
            <Label className="text-xs">Values to match</Label>
            <StringArrayEditor
              value={getValuesArray(value)}
              onChange={(vals) => {
                if ('values' in value && Array.isArray((value as any).values)) {
                  onChange({ ...value, values: vals } as any);
                } else {
                  onChange({ ...value, value: vals } as any);
                }
              }}
              placeholder="value"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function isGroup(x: any): x is FilterGroupFormData {
  return x && typeof x === 'object' && 'operator' in x && 'filters' in x;
}

function showArrayInput(op?: string) {
  return op === 'in' || op === 'notIn';
}

function showPatternInput(op?: string) {
  return op === 'matches' || op === 'notMatches';
}

function showValueInput(op?: string) {
  return !op || (
    op !== 'in' &&
    op !== 'notIn' &&
    op !== 'exists' &&
    op !== 'notExists' &&
    op !== 'matches' &&
    op !== 'notMatches'
  );
}

function getValuesArray(rule: any): string[] {
  if (Array.isArray(rule?.values)) return rule.values as string[];
  if (Array.isArray(rule?.value)) return rule.value as string[];
  return [];
}
