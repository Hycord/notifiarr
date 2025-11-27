'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEvent, useEvents, useUpdateEvent, useCreateEvent, useServers, useSinks } from '@/hooks/use-config-queries';
import { eventConfigSchema, type EventConfigFormData } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/ui/multi-select';
import { FilterBuilder } from '@/components/forms/filter-builder';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { validateEventReferences, validateSinkMetadata } from '@/lib/schemas';
import { Badge } from '@/components/ui/badge';

interface SinkMetadataSectionProps {
  sid: string;
  sinkObj: any;
  current: any;
  allowed: string[];
  transforms: any[];
  selectedTransform: string;
  sinkMetadataMode: 'nested' | 'top';
  metadata: any;
  setValue: any;
}

function SinkMetadataSection({
  sid,
  sinkObj,
  current,
  allowed,
  transforms,
  selectedTransform,
  sinkMetadataMode,
  metadata,
  setValue,
}: SinkMetadataSectionProps) {
  const [sinkExpanded, setSinkExpanded] = React.useState(true);
  
  return (
    <div className="border rounded-md overflow-hidden">
      <button
        onClick={() => setSinkExpanded(!sinkExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{sid}</span>
          {allowed.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{allowed.length} fields</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{sinkExpanded ? '▼' : '▶'}</span>
      </button>
      {sinkExpanded && (
        <div className="p-3 pt-0 space-y-2 border-t">
          {allowed.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {allowed.map((m: string) => (
                <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0.5">{m}</Badge>
              ))}
            </div>
          )}
          {transforms.length > 0 && allowed.includes('transform') && (
            <div className="space-y-1">
              <Label className="text-xs">Transform</Label>
              <Select
                value={selectedTransform}
                onValueChange={(v) => {
                  const nextMeta = { ...current, transform: v };
                  if (sinkMetadataMode === 'nested') {
                    const nextSink = { ...((metadata as any)?.sink || {}), [sid]: nextMeta };
                    setValue('metadata', { ...(metadata || {}), sink: nextSink } as any);
                  } else {
                    setValue('metadata', { ...(metadata || {}), [sid]: nextMeta } as any);
                  }
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select transform" />
                </SelectTrigger>
                <SelectContent>
                  {transforms.map((t: any) => (
                    <SelectItem key={t.name} value={t.name} className="text-sm">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <KeyValueEditor
            value={current}
            onChange={(next) => {
              // Preserve transform selection if present
              if (selectedTransform && allowed.includes('transform') && !next.transform) {
                next.transform = selectedTransform;
              }
              if (sinkMetadataMode === 'nested') {
                const nextSink = { ...((metadata as any)?.sink || {}), [sid]: next };
                setValue('metadata', { ...(metadata || {}), sink: nextSink } as any);
              } else {
                setValue('metadata', { ...(metadata || {}), [sid]: next } as any);
              }
            }}
            placeholderKey="key"
            placeholderValue="value (JSON or text)"
            allowedKeys={allowed.length > 0 ? allowed : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const originalIdRef = React.useRef<string | null>(null);

  const { data: event, isLoading } = useEvent(id);
  const isMissing = !isLoading && !event;
  const { data: servers } = useServers();
  const { data: sinks } = useSinks();
  const { data: allEventsList } = useEvents();
  
  // Track original ID when event data loads
  React.useEffect(() => {
    if (event?.id && !originalIdRef.current) {
      originalIdRef.current = event.id;
    }
  }, [event]);

  const updateEvent = useUpdateEvent({
    onSuccess: (_, variables) => {
      toast.success('Event updated successfully');
      // If ID changed, redirect to new ID
      if (originalIdRef.current && variables.id !== originalIdRef.current) {
        router.push(`/events/${variables.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  const createEvent = useCreateEvent({
    onSuccess: () => {
      toast.success('Event created successfully');
      router.push('/events');
    },
    onError: (error) => toast.error(`Failed to create event: ${error.message}`),
  });

  const form = useForm<EventConfigFormData>({
    resolver: zodResolver(eventConfigSchema),
    mode: 'onChange',
    defaultValues: {
      id,
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

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const enabled = watch('enabled');
  const baseEvent = watch('baseEvent');
  const serverIds = watch('serverIds');
  const sinkIds = watch('sinkIds');
  const filters = watch('filters');
  const group = watch('group');
  const metadata = watch('metadata');
  const sinkMetadataMode = (metadata && typeof metadata === 'object' && (metadata as any).sink && typeof (metadata as any).sink === 'object') ? 'nested' as const : 'top' as const;
  
  // Local state for new group input
  const [newGroupInput, setNewGroupInput] = React.useState('');
  
  // Get all existing groups from all events
  const existingGroups = React.useMemo(() => {
    if (!allEventsList) return [];
    const groups = new Set<string>();
    allEventsList.forEach(e => {
      if (e.group) groups.add(e.group);
    });
    return Array.from(groups).sort();
  }, [allEventsList]);

  const onSubmit = (data: EventConfigFormData) => {
    data.enabled = enabled ?? true;
    data.baseEvent = baseEvent as any;
    data.serverIds = serverIds as string[];
    data.sinkIds = sinkIds as string[];
    data.filters = filters as any;
    data.metadata = metadata as any;

    const serverOptions = (servers || []).map((s: any) => s.id);
    const sinkOptions = (sinks || []).map((s: any) => s.id);
    const refErrors = validateEventReferences(data, serverOptions, sinkOptions);
    const mdErrors = validateSinkMetadata(
      data,
      (sinks || []).map((s: any) => ({ id: s.id, allowedMetadata: s.allowedMetadata }))
    );
    const allErrors = [...refErrors, ...mdErrors];
    if (allErrors.length) {
      allErrors.forEach((e) => toast.error(e));
      return;
    }
    if (isMissing) {
      createEvent.mutate(data);
    } else {
      updateEvent.mutate({ ...data, __originalId: originalIdRef.current || undefined } as any);
    }
  };

  const defaultEventConfig: Partial<EventConfigFormData> = {
    enabled: true,
    baseEvent: 'message',
    priority: 0,
    serverIds: [],
    sinkIds: [],
    filters: { operator: 'and', filters: [] },
    metadata: {},
  };

  return (
    <ConfigEditLayout
      title={isMissing ? `Create Event: ${id}` : `Edit Event: ${event?.name || id}`}
      subtitle={isMissing ? 'Event not found. Create new configuration.' : 'Modify the event configuration'}
      resourceType="event"
      listPath="/events"
      isLoading={isLoading}
      data={isMissing ? { ...(defaultEventConfig as any), id } : event}
      form={form}
      schema={eventConfigSchema}
      isPending={isMissing ? createEvent.isPending : updateEvent.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultEventConfig}
    >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Set up the event name, type, and whether it should be active
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="My Event Rule"
                    />
                    <p className="text-xs text-muted-foreground">
                      A descriptive name to identify this event rule
                    </p>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseEvent">Event type to monitor</Label>
                    <Select
                      value={baseEvent ?? undefined}
                      onValueChange={(value) => setValue('baseEvent', value as any)}
                      defaultValue={event?.baseEvent as any}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">Message</SelectItem>
                        <SelectItem value="join">Join</SelectItem>
                        <SelectItem value="part">Part</SelectItem>
                        <SelectItem value="quit">Quit</SelectItem>
                        <SelectItem value="nick">Nick Change</SelectItem>
                        <SelectItem value="kick">Kick</SelectItem>
                        <SelectItem value="mode">Mode</SelectItem>
                        <SelectItem value="topic">Topic</SelectItem>
                        <SelectItem value="connect">Connect</SelectItem>
                        <SelectItem value="disconnect">Disconnect</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.baseEvent && (
                      <p className="text-sm text-destructive">{errors.baseEvent.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group">Group (Optional)</Label>
                    <Input
                      placeholder="Enter group name (optional)"
                      value={group || ''}
                      onChange={(e) => {
                        setValue('group', e.target.value || undefined);
                      }}
                    />
                    {existingGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {existingGroups.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setValue('group', g)}
                            className="px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Group events together for easier management
                    </p>
                    {errors.group && (
                      <p className="text-sm text-destructive">{errors.group.message}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <Switch
                      id="enabled"
                      checked={enabled ?? true}
                      onCheckedChange={(checked) => setValue('enabled', checked)}
                    />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="enabled" className="cursor-pointer">Enable this event</Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, this event rule will be active and trigger notifications
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Where to monitor and send</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Choose which IRC servers to watch and where to send notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs">IRC servers to monitor</Label>
                    <MultiSelect
                      options={(servers || []).map((s: any) => ({ value: s.id, label: `${s.displayName || s.id}${s.enabled === false ? ' (disabled)' : ''}` }))}
                      values={serverIds as string[]}
                      onChange={(vals) => setValue('serverIds', vals as string[])}
                      placeholder="Choose which servers to watch for this event"
                      showSelectAll={true}
                      selectAllLabel="All servers"
                    />
                    <p className="text-xs text-muted-foreground">
                      This event will only trigger for activity on the selected servers
                    </p>
                    {errors.serverIds && (
                      <p className="text-sm text-destructive">{errors.serverIds.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Notification destinations</Label>
                    <MultiSelect
                      options={(sinks || []).map((s: any) => ({ value: s.id, label: `${s.name || s.id}${s.enabled === false ? ' (disabled)' : ''}` }))}
                      values={sinkIds as string[]}
                      onChange={(vals) => setValue('sinkIds', vals as string[])}
                      placeholder="Where should notifications be sent?"
                      showSelectAll={true}
                      selectAllLabel="All destinations"
                    />
                    <p className="text-xs text-muted-foreground">
                      When this event triggers, notifications will be sent to all selected destinations
                    </p>
                    {errors.sinkIds && (
                      <p className="text-sm text-destructive">{errors.sinkIds.message as string}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event filters</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Set conditions that must be met for this event to trigger
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Use filters to narrow down when notifications are sent. For example, only send alerts for messages containing specific keywords or from particular users.
                  </p>
                  <FilterBuilder
                    value={filters}
                    onChange={(next) => setValue('filters', next)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Destination-specific settings</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Customize how notifications are sent to each destination
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(sinkIds || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">Select notification destinations above to configure their settings</p>
                    </div>
                  )}
                  {(sinkIds || []).map((sid) => {
                    const sinkObj = (sinks || []).find((s: any) => s.id === sid);
                    const current = sinkMetadataMode === 'nested'
                      ? ((metadata as any)?.sink?.[sid] || {})
                      : ((metadata as any)?.[sid] || {});
                    const allowed = sinkObj?.allowedMetadata || [];
                    const transforms = sinkObj?.payloadTransforms || [];
                    const selectedTransform = current?.transform || '';
                    return (
                      <SinkMetadataSection
                        key={sid}
                        sid={sid}
                        sinkObj={sinkObj}
                        current={current}
                        allowed={allowed}
                        transforms={transforms}
                        selectedTransform={selectedTransform}
                        sinkMetadataMode={sinkMetadataMode}
                        metadata={metadata}
                        setValue={setValue}
                      />
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional metadata</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Custom key-value pairs for this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyValueEditor
                    value={(() => {
                      const m = (metadata || {}) as any;
                      if (sinkMetadataMode === 'nested') {
                        const { sink, ...rest } = m;
                        return rest;
                      }
                      // Remove any keys that correspond to sink IDs to avoid editing them here
                      const result: Record<string, any> = {};
                      Object.keys(m || {}).forEach((k) => {
                        if (!(sinkIds || []).includes(k)) result[k] = m[k];
                      });
                      return result;
                    })()}
                    onChange={(next) => {
                      const m = (metadata || {}) as any;
                      if (sinkMetadataMode === 'nested') {
                        setValue('metadata', { sink: m.sink, ...next } as any);
                      } else {
                        // preserve existing per-sink keys
                        const preserved: Record<string, any> = {};
                        Object.keys(m || {}).forEach((k) => {
                          if ((sinkIds || []).includes(k)) preserved[k] = m[k];
                        });
                        setValue('metadata', { ...preserved, ...next } as any);
                      }
                    }}
                    placeholderKey="key"
                    placeholderValue="value (JSON or text)"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Store any additional configuration for this event
                  </p>
                </CardContent>
              </Card>
    </ConfigEditLayout>
  );
}
