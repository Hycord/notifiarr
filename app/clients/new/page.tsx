'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateClient } from '@/hooks/use-config-queries';
import { clientConfigSchema, type ClientConfigFormData, createSlug } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { ParserRulesEditor } from '@/components/forms/parser-rules-editor';
import { useState, useRef, useEffect } from 'react';

export default function NewClientPage() {
  const router = useRouter();
  const [parserRulesText, setParserRulesText] = useState('');
  const createClient = useCreateClient({
    onSuccess: () => {
      toast.success('Client created successfully');
      router.push('/clients');
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });

  const form = useForm<ClientConfigFormData>({
    resolver: zodResolver(clientConfigSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      name: '',
      enabled: true,
      logDirectory: '',
      discovery: { patterns: {}, pathExtraction: {} },
      serverDiscovery: { type: 'static', servers: [] },
      fileType: { type: 'text', encoding: 'utf-8' },
      parserRules: [],
      metadata: {},
    },
  });

  const { register, watch, setValue, formState: { errors } } = form;
  const enabled = watch('enabled');
  const serverDiscovery = watch('serverDiscovery');
  const fileType = watch('fileType');
  const parserRules = watch('parserRules');
  const discovery = watch('discovery');
  const metadata = watch('metadata');

  useEffect(() => {
    if (Array.isArray(parserRules)) {
      setParserRulesText(JSON.stringify(parserRules, null, 2));
    }
  }, []); // initialize once

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue('name', newName);
    if (!watch('id')) setValue('id', createSlug(newName));
  };

  const onSubmit = (data: ClientConfigFormData) => {
    // Sync parser rules from JSON textarea
    try {
      const parsed = JSON.parse(parserRulesText || '[]');
      (data as any).parserRules = parsed;
    } catch {
      toast.error('Parser Rules JSON is invalid');
      return;
    }
    createClient.mutate(data);
  };

  const defaultClientConfig: Partial<ClientConfigFormData> = {
    enabled: true,
    parserRules: [],
  };

  return (
    <ConfigEditLayout
      title="New Client"
      subtitle="Create a new IRC client configuration"
      resourceType="client"
      listPath="/clients"
      isLoading={false}
      data={undefined}
      form={form}
      schema={clientConfigSchema}
      isPending={createClient.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultClientConfig}
      createMode
    >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic client settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} onChange={handleNameChange} placeholder="My IRC Client" />
                <p className="text-xs text-muted-foreground">Friendly display name</p>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  {...register('id')}
                  placeholder="my-irc-client"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and dashes only. Used to identify the client type
                </p>
                {errors.id && (
                  <p className="text-sm text-destructive">{errors.id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logDirectory">Log Directory</Label>
                <Input id="logDirectory" {...register('logDirectory')} placeholder="/path/to/logs" className="font-mono" />
                <p className="text-xs text-muted-foreground">Absolute path to IRC log files</p>
                {errors.logDirectory && <p className="text-sm text-destructive">{errors.logDirectory.message}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={(checked) => setValue('enabled', checked)}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discovery</CardTitle>
              <CardDescription>Patterns and path extraction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discovery.patterns.console">Console Pattern</Label>
                  <Input id="discovery.patterns.console" value={(watch('discovery') as any)?.patterns?.console || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), patterns: { ...((watch('discovery') as any)?.patterns || {}), console: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.patterns.channels">Channels Pattern</Label>
                  <Input id="discovery.patterns.channels" value={(watch('discovery') as any)?.patterns?.channels || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), patterns: { ...((watch('discovery') as any)?.patterns || {}), channels: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.patterns.queries">Queries Pattern</Label>
                  <Input id="discovery.patterns.queries" value={(watch('discovery') as any)?.patterns?.queries || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), patterns: { ...((watch('discovery') as any)?.patterns || {}), queries: e.target.value } })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.serverPattern">Server Pattern</Label>
                  <Input id="discovery.pathExtraction.serverPattern" value={(watch('discovery') as any)?.pathExtraction?.serverPattern || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), serverPattern: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.serverGroup">Server Group</Label>
                  <Input id="discovery.pathExtraction.serverGroup" type="number" value={(watch('discovery') as any)?.pathExtraction?.serverGroup ?? ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), serverGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.channelPattern">Channel Pattern</Label>
                  <Input id="discovery.pathExtraction.channelPattern" value={(watch('discovery') as any)?.pathExtraction?.channelPattern || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), channelPattern: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.channelGroup">Channel Group</Label>
                  <Input id="discovery.pathExtraction.channelGroup" type="number" value={(watch('discovery') as any)?.pathExtraction?.channelGroup ?? ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), channelGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.queryPattern">Query Pattern</Label>
                  <Input id="discovery.pathExtraction.queryPattern" value={(watch('discovery') as any)?.pathExtraction?.queryPattern || ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), queryPattern: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discovery.pathExtraction.queryGroup">Query Group</Label>
                  <Input id="discovery.pathExtraction.queryGroup" type="number" value={(watch('discovery') as any)?.pathExtraction?.queryGroup ?? ''} onChange={(e) => setValue('discovery', { ...(watch('discovery') || {}), pathExtraction: { ...((watch('discovery') as any)?.pathExtraction || {}), queryGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Server Discovery</CardTitle>
              <CardDescription>Configure how servers are discovered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={(watch('serverDiscovery') as any)?.type || 'static'}
                  onValueChange={(v) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="filesystem">Filesystem</SelectItem>
                    <SelectItem value="json">JSON File</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {((watch('serverDiscovery') as any)?.type === 'filesystem') && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.searchPattern">Search Pattern</Label>
                    <Input id="serverDiscovery.searchPattern" value={(watch('serverDiscovery') as any)?.searchPattern || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), searchPattern: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.hostnamePattern">Hostname Pattern</Label>
                    <Input id="serverDiscovery.hostnamePattern" value={(watch('serverDiscovery') as any)?.hostnamePattern || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), hostnamePattern: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.hostnameGroup">Hostname Group</Label>
                    <Input id="serverDiscovery.hostnameGroup" type="number" value={(watch('serverDiscovery') as any)?.hostnameGroup ?? ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), hostnameGroup: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  </div>
                </div>
              )}
              {((watch('serverDiscovery') as any)?.type === 'json') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.jsonPath">JSON File Path</Label>
                    <Input id="serverDiscovery.jsonPath" value={(watch('serverDiscovery') as any)?.jsonPath || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), jsonPath: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.hostnameField">Hostname Field</Label>
                    <Input id="serverDiscovery.hostnameField" value={(watch('serverDiscovery') as any)?.hostnameField || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), hostnameField: e.target.value })} />
                  </div>
                </div>
              )}
              {((watch('serverDiscovery') as any)?.type === 'sqlite') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.query">SQL Query</Label>
                    <Input id="serverDiscovery.query" value={(watch('serverDiscovery') as any)?.query || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), query: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serverDiscovery.hostnameColumn">Hostname Column</Label>
                    <Input id="serverDiscovery.hostnameColumn" value={(watch('serverDiscovery') as any)?.hostnameColumn || ''} onChange={(e) => setValue('serverDiscovery', { ...(watch('serverDiscovery') || {}), hostnameColumn: e.target.value })} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Type</CardTitle>
              <CardDescription>Configure log file characteristics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={(watch('fileType') as any)?.type || 'text'}
                    onValueChange={(v) => setValue('fileType', { ...(watch('fileType') || {}), type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileType.encoding">Encoding</Label>
                  <Input id="fileType.encoding" value={(watch('fileType') as any)?.encoding || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), encoding: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileType.lineEnding">Line Ending</Label>
                  <Input id="fileType.lineEnding" value={(watch('fileType') as any)?.lineEnding || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), lineEnding: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileType.timestampFormat">Timestamp Format</Label>
                  <Input id="fileType.timestampFormat" value={(watch('fileType') as any)?.timestampFormat || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), timestampFormat: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileType.timezone">Timezone</Label>
                  <Input id="fileType.timezone" value={(watch('fileType') as any)?.timezone || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), timezone: e.target.value })} />
                </div>
                {(watch('fileType') as any)?.type === 'sqlite' && (
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="fileType.query">SQLite Query</Label>
                    <Input id="fileType.query" value={(watch('fileType') as any)?.query || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), query: e.target.value })} />
                  </div>
                )}
                {(watch('fileType') as any)?.type === 'json' && (
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="fileType.jsonPath">JSON Path</Label>
                    <Input id="fileType.jsonPath" value={(watch('fileType') as any)?.jsonPath || ''} onChange={(e) => setValue('fileType', { ...(watch('fileType') || {}), jsonPath: e.target.value })} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message parsing rules</CardTitle>
              <CardDescription>Define regex patterns to extract data from log lines</CardDescription>
            </CardHeader>
            <CardContent>
              <ParserRulesEditor
                value={parserRules as any}
                onChange={(next) => {
                  setValue('parserRules', next as any);
                  setParserRulesText(JSON.stringify(next, null, 2));
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced: Raw JSON editor</CardTitle>
              <CardDescription>Edit parser rules as JSON for advanced customization</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-md border bg-background p-3 font-mono text-sm"
                rows={10}
                value={parserRulesText}
                onChange={(e) => setParserRulesText(e.target.value)}
                onBlur={() => {
                  try {
                    const parsed = JSON.parse(parserRulesText || '[]');
                    setValue('parserRules', parsed as any);
                  } catch {
                    // keep text; validation on submit
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">Changes apply when focus leaves the editor; invalid JSON rejected on save.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Arbitrary key-values</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyValueEditor
                value={watch('metadata') as any}
                onChange={(next) => setValue('metadata', next as any)}
                placeholderKey="key"
                placeholderValue="value (JSON or text)"
              />
            </CardContent>
          </Card>

    </ConfigEditLayout>
  );
}
