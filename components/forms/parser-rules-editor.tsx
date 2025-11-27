"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

export interface ParserRuleForm {
  id?: string;
  name?: string;
  pattern: string;
  flags?: string;
  priority?: number;
  skip?: boolean;
  messageType?: string;
  captures?: {
    timestamp?: string;
    nickname?: string;
    username?: string;
    hostname?: string;
    content?: string;
    target?: string;
    mode?: string;
    newnick?: string;
    reason?: string;
    topic?: string;
    [key: string]: string | undefined;
  };
  // Legacy format support
  eventType?: string;
  groups?: {
    timestamp?: number;
    sender?: number;
    action?: number;
    content?: number;
    target?: number;
    mode?: number;
    oldNick?: number;
    newNick?: number;
    reason?: number;
    topic?: number;
  };
}

interface ParserRulesEditorProps {
  value: ParserRuleForm[] | undefined;
  onChange: (rules: ParserRuleForm[]) => void;
}

export function ParserRulesEditor({ value, onChange }: ParserRulesEditorProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rules = value || [];

  const updateRule = (index: number, patch: Partial<ParserRuleForm>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules.length) return;
    const next = [...rules];
    const [r] = next.splice(from, 1);
    next.splice(to, 0, r);
    onChange(next);
  };

  const removeRule = (index: number) => {
    const next = [...rules];
    next.splice(index, 1);
    onChange(next);
  };

  const addRule = () => {
    onChange([
      ...rules,
      {
        name: `rule-${rules.length + 1}`,
        pattern: '',
        priority: rules.length,
        skip: false,
        messageType: 'privmsg',
        captures: {},
      },
    ]);
  };

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => {
        const ruleId = rule.name || rule.id || `rule-${index + 1}`;
        const isOpen = expanded === ruleId;
        return (
          <Card key={index} className="border">
            <CardContent className="pt-4 space-y-4">
              {/* Header with rule name and controls */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-sm font-medium truncate">{ruleId}</span>
                    {rule.messageType && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded shrink-0">
                        {rule.messageType}
                      </span>
                    )}
                    {rule.skip && (
                      <span className="text-xs text-destructive px-2 py-0.5 bg-destructive/10 rounded shrink-0">
                        skip
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveRule(index, index - 1)}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveRule(index, index + 1)}
                      disabled={index === rules.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(index)}
                      aria-label="Remove rule"
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(isOpen ? null : ruleId)}
                  className="w-full justify-center"
                >
                  {isOpen ? 'Collapse' : 'Expand'}
                </Button>
              </div>

              {isOpen && (
                <div className="space-y-4 pt-2">
                  {/* Basic fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`rule-${index}-name`} className="text-xs">Rule name</Label>
                      <Input
                        id={`rule-${index}-name`}
                        value={rule.name || ''}
                        placeholder="privmsg"
                        onChange={(e) => updateRule(index, { name: e.target.value })}
                        className="text-sm font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for this parsing rule
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`rule-${index}-pattern`} className="text-xs">Pattern (regex)</Label>
                      <Input
                        id={`rule-${index}-pattern`}
                        value={rule.pattern}
                        placeholder="^\\[(?<timestamp>[^\\]]+)\\]\\s+<(?<nickname>[^>]+)>\\s+(?<content>.+)$"
                        onChange={(e) => updateRule(index, { pattern: e.target.value })}
                        className="text-sm font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use named capture groups like (?&lt;timestamp&gt;...) to extract fields
                      </p>
                    </div>
                  </div>

                  {/* Grid fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`rule-${index}-messageType`} className="text-xs">Message type</Label>
                      <Select
                        value={rule.messageType || 'privmsg'}
                        onValueChange={(v) => updateRule(index, { messageType: v })}
                      >
                        <SelectTrigger id={`rule-${index}-messageType`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {['privmsg','notice','join','part','quit','nick','kick','mode','topic','system'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        IRC message type this rule matches
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`rule-${index}-priority`} className="text-xs">Priority</Label>
                      <Input
                        id={`rule-${index}-priority`}
                        type="number"
                        value={rule.priority ?? ''}
                        onChange={(e) => updateRule(index, { priority: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="100"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher priority rules are checked first
                      </p>
                    </div>
                  </div>

                  {/* Skip toggle */}
                  <Card className="border">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          id={`rule-${index}-skip`}
                          checked={rule.skip || false}
                          onCheckedChange={(checked) => updateRule(index, { skip: checked })}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor={`rule-${index}-skip`} className="text-sm font-medium cursor-pointer">
                            Skip matching lines
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Don't process lines that match this pattern
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Captures section */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Named captures</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Map capture group names to message fields (e.g., "timestamp" → "timestamp")
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['timestamp','nickname','username','hostname','content','target','mode','newnick','reason','topic'].map(key => (
                        <div key={key} className="space-y-1.5">
                          <Label htmlFor={`rule-${index}-capture-${key}`} className="text-xs capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <Input
                            id={`rule-${index}-capture-${key}`}
                            type="text"
                            value={(rule.captures && rule.captures[key]) ?? ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              const nextCaptures = { ...(rule.captures || {}), [key]: val || undefined };
                              if (!val) delete nextCaptures[key];
                              updateRule(index, { captures: nextCaptures });
                            }}
                            placeholder={key}
                            className="text-sm font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="secondary" onClick={addRule} className="w-full flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" /> Add parser rule
      </Button>
    </div>
  );
}
