'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StringArrayEditor, KeyValueEditor } from './key-value-editor';
import { Plus, Trash2 } from 'lucide-react';

export interface ServerUser {
  realname?: string;
  modes?: string[];
  metadata?: Record<string, any>;
}

export interface UsersEditorProps {
  value?: Record<string, ServerUser>;
  onChange: (next: Record<string, ServerUser>) => void;
}

export function UsersEditor({ value, onChange }: UsersEditorProps) {
  const entries = Object.entries(value || {});

  function updateNickname(oldNick: string, newNick: string) {
    if (!newNick) return;
    const copy: Record<string, ServerUser> = { ...(value || {}) };
    copy[newNick] = copy[oldNick] || {};
    delete copy[oldNick];
    onChange(copy);
  }

  function updateField(nick: string, patch: Partial<ServerUser>) {
    const copy: Record<string, ServerUser> = { ...(value || {}) };
    copy[nick] = { ...(copy[nick] || {}), ...patch };
    onChange(copy);
  }

  function remove(nick: string) {
    const copy: Record<string, ServerUser> = { ...(value || {}) };
    delete copy[nick];
    onChange(copy);
  }

  function add() {
    const copy: Record<string, ServerUser> = { ...(value || {}) };
    let nick = 'user';
    let i = 1;
    while (copy[nick]) nick = `user_${i++}`;
    copy[nick] = {};
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No users</p>
      )}
      {entries.map(([nick, u], idx) => (
        <Card key={idx}>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`nickname-${idx}`} className="text-sm font-medium">Nickname</Label>
                <Input 
                  id={`nickname-${idx}`}
                  className="font-mono text-sm w-full" 
                  value={nick} 
                  onChange={(e) => updateNickname(nick, e.target.value)} 
                />
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="shrink-0 mt-6" 
                onClick={() => remove(nick)}
                aria-label={`Remove user ${nick}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`realname-${idx}`} className="text-xs">Real name</Label>
                <Input
                  id={`realname-${idx}`}
                  placeholder="Real name"
                  value={u.realname || ''}
                  onChange={(e) => updateField(nick, { realname: e.target.value })}
                />
              </div>
              <StringArrayEditor
                label="Modes"
                value={u.modes || []}
                onChange={(next) => updateField(nick, { modes: next })}
                placeholder="+o"
              />
            </div>
            <KeyValueEditor
              label="Metadata"
              value={u.metadata || {}}
              onChange={(next) => updateField(nick, { metadata: next })}
              placeholderKey="key"
              placeholderValue="value (JSON or text)"
            />
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Add User
      </Button>
    </div>
  );
}
