'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateEvent, useEvents, useServers, useSinks } from '@/hooks/use-config-queries';
import { eventConfigSchema, type EventConfigFormData, createSlug } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { Badge } from '@/components/ui/badge';
import { FilterBuilder } from '@/components/forms/filter-builder';
import { toast } from 'sonner';

export default function NewEventPage() {
  const router = useRouter();
  const { data: servers } = useServers();
  const { data: sinks } = useSinks();
  const { data: allEventsList } = useEvents();

  const form = useForm<EventConfigFormData>({
    resolver: zodResolver(eventConfigSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      name: '',
      enabled: true,
      baseEvent: 'message',
      serverIds: [],
      sinkIds: [],
      priority: 0,
      metadata: {},
      filters: { operator: 'and', filters: [] },
    },
  });

  const { register, watch, setValue, formState: { errors } } = form;
  const enabled = watch('enabled');
  const baseEvent = watch('baseEvent');
  const serverIds = watch('serverIds');
  const sinkIds = watch('sinkIds');
  const metadata = watch('metadata');
  const filters = watch('filters');

  const [selectedGroupOption, setSelectedGroupOption] = React.useState<string>('');
  const [customGroup, setCustomGroup] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedGroupOption === '__custom__') {
      setValue('group', customGroup || undefined);
    } else {
      setValue('group', selectedGroupOption || undefined);
    }
  }, [selectedGroupOption, customGroup, setValue]);

  const createEvent = useCreateEvent({
    onSuccess: () => {
      toast.success('Event created successfully');
      router.push('/events');
    },
    onError: (error) => toast.error(`Failed to create event: ${error.message}`),
  });

  const existingGroups = React.useMemo(() => {
    if (!allEventsList) return [];
    const groups = new Set<string>();
    allEventsList.forEach(e => { if (e.group) groups.add(e.group); });
    return Array.from(groups).sort();
  }, [allEventsList]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue('name', newName);
    if (!watch('id')) setValue('id', createSlug(newName));
  };

  const onSubmit = (data: EventConfigFormData) => {
    createEvent.mutate(data);
  };

  const defaultEventConfig: Partial<EventConfigFormData> = {
    enabled: true,
    baseEvent: 'message',
    serverIds: [],
    sinkIds: [],
    metadata: {},
    priority: 0,
    filters: { operator: 'and', filters: [] },
  };

  return (
    <ConfigEditLayout
      title="New Event"
      subtitle="Create a new event configuration"
      resourceType="event"
      listPath="/events"
      isLoading={false}
      data={undefined}
      form={form}
      schema={eventConfigSchema}
      isPending={createEvent.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultEventConfig}
      createMode
    >
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure the event details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} onChange={handleNameChange} placeholder="My Event Rule" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="id">ID</Label>
              <Input id="id" {...register('id')} placeholder="my-event" className="font-mono" />
              {errors.id && <p className="text-sm text-destructive">{errors.id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="baseEvent">Base Event</Label>
              <Select value={baseEvent} onValueChange={(value: any) => setValue('baseEvent', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="join">Join</SelectItem>
                  <SelectItem value="part">Part</SelectItem>
                  <SelectItem value="quit">Quit</SelectItem>
                  <SelectItem value="nick">Nick</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="mode">Mode</SelectItem>
                  <SelectItem value="topic">Topic</SelectItem>
                  <SelectItem value="connect">Connect</SelectItem>
                  <SelectItem value="disconnect">Disconnect</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              {errors.baseEvent && <p className="text-sm text-destructive">{String(errors.baseEvent.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (optional)</Label>
              <Input
                id="priority"
                type="number"
                value={String(watch('priority') ?? 0)}
                onChange={(e) => setValue('priority', e.target.value === '' ? 0 : Number(e.target.value))}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Group (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              <Select
                value={selectedGroupOption || ''}
                onValueChange={(value) => {
                  setSelectedGroupOption(value);
                  if (value !== '__custom__') setCustomGroup('');
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {existingGroups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Custom group"
                value={selectedGroupOption === '__custom__' ? customGroup : ''}
                onChange={(e) => setCustomGroup(e.target.value)}
                disabled={selectedGroupOption !== '__custom__'}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Choose an existing group or define a new one.</p>
            {errors.group && <p className="text-sm text-destructive">{errors.group?.message}</p>}
          </div>

          <div className="flex items-start space-x-3 rounded-md border p-4">
            <Switch id="enabled" checked={enabled} onCheckedChange={(checked) => setValue('enabled', checked)} />
            <div className="space-y-1 flex-1">
              <Label htmlFor="enabled" className="cursor-pointer">Enabled</Label>
              <p className="text-xs text-muted-foreground">Enable or disable this event rule.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs">Servers</Label>
              <MultiSelect
                options={(servers || []).map((s: any) => ({ value: s.id, label: `${s.displayName || s.id}${s.enabled === false ? ' (disabled)' : ''}` }))}
                values={serverIds as string[]}
                onChange={(vals) => setValue('serverIds', vals as string[])}
                placeholder="Select servers…"
                showSelectAll={true}
                selectAllLabel="All Servers"
              />
              {errors.serverIds && <p className="text-sm text-destructive">{String(errors.serverIds.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sinks</Label>
              <MultiSelect
                options={(sinks || []).map((s: any) => ({ value: s.id, label: `${s.name || s.id}${s.enabled === false ? ' (disabled)' : ''}` }))}
                values={sinkIds as string[]}
                onChange={(vals) => setValue('sinkIds', vals as string[])}
                placeholder="Select sinks…"
                showSelectAll={true}
                selectAllLabel="All Sinks"
              />
              {errors.sinkIds && <p className="text-sm text-destructive">{String(errors.sinkIds.message)}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Define boolean logic for when this event triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <FilterBuilder value={filters as any} onChange={(next) => setValue('filters', next as any)} />
        </CardContent>
      </Card>

      {Array.isArray(sinkIds) && sinkIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Sink Metadata</CardTitle>
            <CardDescription>Configure metadata overrides per selected sink</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sinkIds.map((sid) => {
              const sinkObj = (sinks || []).find((s: any) => s.id === sid);
              const allowed = sinkObj?.allowedMetadata || [];
              const transforms = sinkObj?.payloadTransforms || [];
              const current = (metadata as any)?.[sid] || {};
              const selectedTransform = current.transform || '';
              return (
                <div key={sid} className="space-y-2 border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Sink: {sid}</Label>
                    {allowed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {allowed.map((m: string) => (
                          <Badge key={m} variant="secondary" className="text-[10px] px-1 py-0.5">{m}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {transforms.length > 0 && allowed.includes('transform') && (
                    <div className="space-y-1">
                      <Label className="text-xs">Transform</Label>
                      <Select
                        value={selectedTransform}
                        onValueChange={(v) => {
                          const nextMeta = { ...current, transform: v };
                          setValue('metadata', { ...(metadata || {}), [sid]: nextMeta } as any);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select transform" />
                        </SelectTrigger>
                        <SelectContent>
                          {transforms.map((t: any) => (
                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <KeyValueEditor
                    value={current}
                    onChange={(next) => {
                      if (selectedTransform && allowed.includes('transform') && !next.transform) {
                        next.transform = selectedTransform;
                      }
                      setValue('metadata', { ...(metadata || {}), [sid]: next } as any);
                    }}
                    placeholderKey="key"
                    placeholderValue="value (JSON or text)"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General Metadata</CardTitle>
          <CardDescription>Top-level metadata not tied to specific sinks</CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueEditor
            value={(() => {
              const m = (metadata || {}) as any;
              const result: Record<string, any> = {};
              Object.keys(m).forEach((k) => {
                if (!(sinkIds || []).includes(k)) result[k] = m[k];
              });
              return result;
            })()}
            onChange={(next) => {
              const currentAll = (metadata || {}) as any;
              const preserved: Record<string, any> = {};
              Object.keys(currentAll).forEach((k) => {
                if ((sinkIds || []).includes(k)) preserved[k] = currentAll[k];
              });
              setValue('metadata', { ...preserved, ...next } as any);
            }}
            placeholderKey="key"
            placeholderValue="value (JSON or text)"
          />
        </CardContent>
      </Card>
    </ConfigEditLayout>
  );
}
