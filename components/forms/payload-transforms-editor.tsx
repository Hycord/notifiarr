"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { FilterBuilder } from '@/components/forms/filter-builder';
import dynamic from 'next/dynamic';
import { KeyValueEditor } from '@/components/forms/key-value-editor';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export interface PayloadTransformForm {
  name: string;
  contentType?: string;
  method?: string;
  headers?: Record<string, string | { template: string }>;
  bodyFormat: 'json' | 'text' | 'form' | 'custom';
  jsonTemplate?: Record<string, any>;
  textTemplate?: string;
  formTemplate?: Record<string, string>;
  priority?: number;
  condition?: any; // FilterConfig
}

interface PayloadTransformsEditorProps {
  value: PayloadTransformForm[] | undefined;
  onChange: (transforms: PayloadTransformForm[]) => void;
  dark?: boolean;
}

export function PayloadTransformsEditor({ value, onChange, dark }: PayloadTransformsEditorProps) {
  const transforms = value || [];
  const [activeCodeTab, setActiveCodeTab] = useState('json');
  const [showPreview, setShowPreview] = useState<Record<string, boolean>>({});

  const sampleContext: Record<string, any> = {
    title: 'Sample Title',
    body: 'Sample Body',
    sender: 'nick',
    channel: '#channel',
    server: 'libera',
    event: 'message',
    metadata: {
      url: 'https://example.com',
      timestamp: { iso: new Date().toISOString() },
      colorHex: '#00AAFF',
    },
  };

  function resolvePath(obj: any, path: string): any {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return '';
      cur = cur[p];
    }
    return cur == null ? '' : cur;
  }

  function renderTemplateString(str: string | undefined): string {
    if (!str) return '';
    return str.replace(/{{\s*([^}]+)\s*}}/g, (_, expr) => {
      return String(resolvePath(sampleContext, expr.trim()));
    });
  }

  function buildPreview(t: PayloadTransformForm): string {
    switch (t.bodyFormat) {
      case 'json': {
        const jsonObj = (t.jsonTemplate || {});
        const mapped = JSON.parse(
          renderTemplateString(
            JSON.stringify(jsonObj, (_, v) => v, 2)
          ) || '{}'
        );
        return JSON.stringify(mapped, null, 2);
      }
      case 'text':
        return renderTemplateString(t.textTemplate || '');
      case 'form': {
        const ft = t.formTemplate || {};
        const entries = Object.entries(ft).map(([k, v]) => `${k}=${encodeURIComponent(renderTemplateString(v))}`);
        return entries.join('&');
      }
      case 'custom':
        return 'Custom format relies on runtime metadata payload.';
      default:
        return '';
    }
  }

  const update = (index: number, patch: Partial<PayloadTransformForm>) => {
    const next = [...transforms];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= transforms.length) return;
    const next = [...transforms];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = (index: number) => {
    const next = [...transforms];
    next.splice(index, 1);
    onChange(next);
  };

  const add = () => {
    onChange([
      ...transforms,
      {
        name: `transform-${transforms.length + 1}`,
        bodyFormat: 'json',
        jsonTemplate: {},
        priority: (transforms.length + 1) * 10,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {transforms.map((t, i) => {
        return (
          <Card key={i} className="border">
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={t.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className="h-8 flex-1 sm:w-40 font-mono text-xs"
                    placeholder="name"
                  />
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, i + 1)} disabled={i === transforms.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setShowPreview({ ...showPreview, [t.name]: !showPreview[t.name] })}
                    title="Toggle Preview"
                  >
                    {showPreview[t.name] ? '–' : '👁'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Content-Type</Label>
                  <Input value={t.contentType || ''} onChange={(e) => update(i, { contentType: e.target.value })} placeholder="application/json" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Method</Label>
                  <Input value={t.method || ''} onChange={(e) => update(i, { method: e.target.value })} placeholder="POST" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Body format</Label>
                  <Select value={t.bodyFormat} onValueChange={(v: any) => update(i, { bodyFormat: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Priority</Label>
                  <Input
                    type="number"
                    value={t.priority ?? ''}
                    onChange={(e) => update(i, { priority: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Condition?</Label>
                  <Switch
                    checked={!!t.condition}
                    onCheckedChange={(checked) => update(i, { condition: checked ? { field: 'event', operator: 'exists' } : undefined })}
                  />
                </div>
              </div>
              {t.condition && (
                <div className="space-y-2">
                  <Label className="text-xs">Condition Filter</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    <Input
                      className="text-xs"
                      placeholder="field"
                      value={t.condition.field}
                      onChange={(e) => update(i, { condition: { ...t.condition, field: e.target.value } })}
                    />
                    <Select
                      value={t.condition.operator}
                      onValueChange={(v: any) => update(i, { condition: { ...t.condition, operator: v } })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['equals','notEquals','contains','notContains','matches','notMatches','exists','notExists','in','notIn'].map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="text-xs"
                      placeholder={t.condition.operator.startsWith('not') || t.condition.operator === 'exists' || t.condition.operator === 'notExists' ? '(n/a)' : 'value'}
                      disabled={['exists','notExists'].includes(t.condition.operator)}
                      value={t.condition.value ?? ''}
                      onChange={(e) => update(i, { condition: { ...t.condition, value: e.target.value } })}
                    />
                    {['matches','notMatches'].includes(t.condition.operator) ? (
                      <Input
                        className="text-xs"
                        placeholder="pattern"
                        value={t.condition.pattern ?? ''}
                        onChange={(e) => update(i, { condition: { ...t.condition, pattern: e.target.value } })}
                      />
                    ) : (
                      <Input className="text-xs" disabled placeholder="pattern (regex only)" />
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-sm">Headers</Label>
                <KeyValueEditor
                  value={t.headers as any}
                  onChange={(next) => update(i, { headers: next })}
                  placeholderKey="Header-Name"
                  placeholderValue='value OR { "template": "..." }'
                  // Headers values must be string or { template: string }
                  // Parse to object only if user provides a JSON object; otherwise keep as string
                  valueParser="object-or-string"
                />
              </div>

              {t.bodyFormat === 'json' && (
                <div className="space-y-2">
                  <Label className="text-sm">JSON Template</Label>
                  <Editor
                    height="200px"
                    defaultLanguage="json"
                    value={JSON.stringify(t.jsonTemplate || {}, null, 2)}
                    onChange={(v) => {
                      try {
                        const parsed = JSON.parse(v || '{}');
                        update(i, { jsonTemplate: parsed });
                      } catch {
                        /* ignore */
                      }
                    }}
                    theme={dark ? 'vs-dark' : 'light'}
                    options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, automaticLayout: true }}
                  />
                </div>
              )}

              {t.bodyFormat === 'text' && (
                <div className="space-y-2">
                  <Label className="text-sm">Text Template</Label>
                  <Input
                    value={t.textTemplate || ''}
                    onChange={(e) => update(i, { textTemplate: e.target.value })}
                    placeholder="{{body}}"
                  />
                </div>
              )}

              {t.bodyFormat === 'form' && (
                <div className="space-y-2">
                  <Label className="text-sm">Form Template Fields</Label>
                  <KeyValueEditor
                    value={t.formTemplate as any}
                    onChange={(next) => update(i, { formTemplate: next })}
                    placeholderKey="field"
                    placeholderValue="value"
                    // Form template values must be strings
                    valueParser="string"
                  />
                </div>
              )}

              {t.bodyFormat === 'custom' && (
                <div className="space-y-1">
                  <Label className="text-xs">Preview</Label>
                  <pre className="bg-muted/50 rounded p-2 text-xs whitespace-pre-wrap max-h-40 overflow-auto">
{buildPreview(t)}
                  </pre>
                </div>
              )}
              {t.bodyFormat === 'custom' && !showPreview[t.name] && (
                <p className="text-xs text-muted-foreground">Custom format expects event metadata to provide full payload.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="secondary" onClick={add} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Add Transform
      </Button>
    </div>
  );
}
