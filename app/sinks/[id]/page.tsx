'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect, useMemo } from 'react';
import { useSink, useUpdateSink } from '@/hooks/use-config-queries';
import { sinkConfigSchema, type SinkConfigFormData } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyValueEditor, StringArrayEditor } from '@/components/forms/key-value-editor';
import { Badge } from '@/components/ui/badge';
import { PayloadTransformsEditor } from '@/components/forms/payload-transforms-editor';

export default function EditSinkPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const originalIdRef = useRef<string | null>(null);

  const { data: sink, isLoading } = useSink(id);
  
  // Track original ID when sink data loads
  useEffect(() => {
    if (sink?.id && !originalIdRef.current) {
      originalIdRef.current = sink.id;
    }
  }, [sink]);

  const updateSink = useUpdateSink({
    onSuccess: (_, variables) => {
      toast.success('Sink updated successfully');
      // If ID changed, redirect to new ID
      if (originalIdRef.current && variables.id !== originalIdRef.current) {
        router.push(`/sinks/${variables.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update sink: ${error.message}`);
    },
  });

  const form = useForm<SinkConfigFormData>({
    resolver: zodResolver(sinkConfigSchema),
    mode: 'onChange',
    // Exclude 'type' to avoid dirty state caused by initial default not matching loaded sink
    defaultValues: {
      id: id || '',
      name: '',
      enabled: true,
      config: {},
      template: {},
      rateLimit: {},
      allowedMetadata: [],
      metadata: {},
      payloadTransforms: [],
    } as any,
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const enabled = watch('enabled');
  const sinkType = watch('type');
  const config = watch('config');
  const template = watch('template');
  const rateLimit = watch('rateLimit');
  const allowedMetadata = watch('allowedMetadata');
  const metadata = watch('metadata');
  const payloadTransforms = watch('payloadTransforms');

  const onSubmit = (data: SinkConfigFormData) => {
    const sanitizeTransforms = (transforms: any[] | undefined) => {
      if (!Array.isArray(transforms)) return transforms;
      return transforms.map((t) => {
        const next: any = { ...t };
        // Sanitize condition: drop if invalid
        if (next.condition) {
          const c = next.condition;
          const allowedOps = ['equals','notEquals','contains','notContains','matches','notMatches','exists','notExists','in','notIn'];
          if (typeof c.field !== 'string' || !allowedOps.includes(c.operator)) {
            delete next.condition;
          } else if (c.operator === 'exists' || c.operator === 'notExists') {
            // no value needed
            delete next.value;
          }
        }
        // Sanitize headers: allow string, number, or { template: string }
        if (next.headers && typeof next.headers === 'object') {
          const h: Record<string, any> = {};
          Object.entries(next.headers).forEach(([k, v]) => {
            if (v && typeof v === 'object' && !Array.isArray(v) && typeof (v as any).template === 'string') {
              h[k] = v;
            } else if (typeof v === 'string' || typeof v === 'number') {
              h[k] = v;
            } else {
              h[k] = String(v);
            }
          });
          next.headers = h;
        }
        // Sanitize formTemplate: values must be strings
        if (next.formTemplate && typeof next.formTemplate === 'object') {
          const ft: Record<string, string> = {};
          Object.entries(next.formTemplate).forEach(([k, v]) => {
            ft[k] = typeof v === 'string' ? v : String(v);
          });
          next.formTemplate = ft;
        }
        return next;
      });
    };

    const sanitized: any = { ...data, payloadTransforms: sanitizeTransforms((data as any).payloadTransforms) };
    updateSink.mutate({ ...sanitized, __originalId: originalIdRef.current || undefined } as any);
  };

  const defaultSinkConfig = useMemo<Partial<SinkConfigFormData>>(
    () => ({
      enabled: true,
      config: {},
      template: {},
      rateLimit: {},
      allowedMetadata: [],
      metadata: {},
      payloadTransforms: [],
    }),
    []
  );

  return (
    <ConfigEditLayout
      title={`Edit Sink: ${sink?.name || id}`}
      subtitle="Modify the notification sink configuration"
      resourceType="sink"
      listPath="/sinks"
      isLoading={isLoading}
      data={sink}
      form={form}
      schema={sinkConfigSchema}
      isPending={updateSink.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultSinkConfig}
    >
              <Card>
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                  <CardDescription>
                    Set up the notification destination details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Sink name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="My Notification Sink"
                    />
                    <p className="text-xs text-muted-foreground">
                      A friendly name to identify this notification destination
                    </p>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Notification type</Label>
                    <Select
                      value={sinkType || sink?.type || undefined}
                      onValueChange={(value) => setValue('type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How should notifications be sent?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ntfy">Ntfy (topics over HTTP)</SelectItem>
                        <SelectItem value="webhook">Webhook (HTTP POST)</SelectItem>
                        <SelectItem value="console">Console (terminal output)</SelectItem>
                        <SelectItem value="file">File (write to disk)</SelectItem>
                        <SelectItem value="custom">Custom integration</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The method used to deliver notifications
                    </p>
                    {errors.type && (
                      <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id">Unique identifier</Label>
                    <Input
                      id="id"
                      {...register('id')}
                      className="font-mono"
                      placeholder="my-sink-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and dashes only. Used in configuration files
                    </p>
                    {errors.id && (
                      <p className="text-sm text-destructive">{errors.id.message}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <Switch
                      id="enabled"
                      checked={enabled}
                      onCheckedChange={(checked) => setValue('enabled', checked)}
                    />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="enabled" className="cursor-pointer">Enable this sink</Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, notifications will be sent to this destination
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection settings</CardTitle>
                  <CardDescription>
                    Configure how to connect to this notification service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Configuration options</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Service-specific settings (e.g., API URL, authentication tokens, topic names)
                    </p>
                    <KeyValueEditor
                      value={config as any}
                      onChange={(next) => setValue('config', next as any)}
                      placeholderKey="url"
                      placeholderValue="https://api.example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message template</CardTitle>
                  <CardDescription>
                    Define how IRC messages are formatted for this notification service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Template fields</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use {'{{path}}'} tokens to insert dynamic values. Common fields: title, message, username, channel
                    </p>
                    <KeyValueEditor
                      value={template as any}
                      onChange={(next) => setValue('template', next as any)}
                      placeholderKey="title"
                      placeholderValue="{{server}} - {{channel}}"
                    />
                  </div>

                  {sinkType === 'webhook' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Payload transformations</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Advanced: Transform the notification payload before sending
                      </p>
                      <PayloadTransformsEditor
                        value={payloadTransforms as any}
                        onChange={(next) => setValue('payloadTransforms', next as any)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate limiting</CardTitle>
                  <CardDescription>
                    Prevent notification spam by limiting how many can be sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit.maxPerMinute">Maximum per minute</Label>
                      <Input
                        id="rateLimit.maxPerMinute"
                        type="number"
                        value={(rateLimit as any)?.maxPerMinute ?? ''}
                        onChange={(e) => setValue('rateLimit', { ...(rateLimit || {}), maxPerMinute: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="60"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no limit
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit.maxPerHour">Maximum per hour</Label>
                      <Input
                        id="rateLimit.maxPerHour"
                        type="number"
                        value={(rateLimit as any)?.maxPerHour ?? ''}
                        onChange={(e) => setValue('rateLimit', { ...(rateLimit || {}), maxPerHour: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no limit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event metadata</CardTitle>
                  <CardDescription>
                    Define which metadata fields events can pass to this sink
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Allowed metadata keys</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Events can provide custom metadata for each sink. Specify which keys are allowed here.
                    </p>
                    <StringArrayEditor
                      value={allowedMetadata as any}
                      onChange={(next) => setValue('allowedMetadata', next as any)}
                      placeholder="priority"
                    />
                    {/* {Array.isArray(allowedMetadata) && allowedMetadata.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">Allowed keys:</span>
                        {allowedMetadata.map((m) => (
                          <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    )} */}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional metadata</CardTitle>
                  <CardDescription>
                    Custom key-value pairs for this sink
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyValueEditor
                    value={metadata as any}
                    onChange={(next) => setValue('metadata', next as any)}
                    placeholderKey="key"
                    placeholderValue="value (JSON or text)"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Store any additional configuration specific to your setup
                  </p>
                </CardContent>
              </Card>
    </ConfigEditLayout>
  );
}
