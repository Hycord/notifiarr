'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClient, useUpdateClient } from '@/hooks/use-config-queries';
import { clientConfigSchema, type ClientConfigFormData } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyValueEditor, StringArrayEditor } from '@/components/forms/key-value-editor';
import { ParserRulesEditor } from '@/components/forms/parser-rules-editor';

export default function EditClientPage() {
  const DEBUG_FORMS = process.env.NEXT_PUBLIC_DEBUG_FORMS === 'true';
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [parserRulesText, setParserRulesText] = useState('');
  const originalIdRef = useRef<string | null>(null);

  const { data: client, isLoading } = useClient(id);
  
  // Initialize parserRulesText and track original ID when client data loads
  useEffect(() => {
    if (client?.parserRules) {
      setParserRulesText(JSON.stringify(client.parserRules, null, 2));
    }
    if (client?.id && !originalIdRef.current) {
      originalIdRef.current = client.id;
    }
  }, [client]);

  const updateClient = useUpdateClient({
    onSuccess: (_, variables) => {
      toast.success('Client updated successfully');
      // If ID changed, redirect to new ID
      if (originalIdRef.current && variables.id !== originalIdRef.current) {
        router.push(`/clients/${variables.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const form = useForm<ClientConfigFormData>({
    resolver: zodResolver(clientConfigSchema),
    mode: 'onChange',
    // Provide stable defaults to avoid undefined-driven render churn
    defaultValues: {
      id: (params.id as string) || '',
      name: '',
      enabled: true,
      logDirectory: '',
      discovery: {
        patterns: {},
        pathExtraction: {},
      },
      serverDiscovery: {
        type: 'static',
        servers: [],
      } as any,
      fileType: {
        type: 'text',
        encoding: 'utf-8',
      } as any,
      parserRules: [],
      metadata: {},
    } as any,
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Use Controller for boolean switch to avoid render loops
  const serverDiscovery = watch('serverDiscovery');
  const fileType = watch('fileType');
  const parserRules = watch('parserRules');
  const discovery = watch('discovery');
  const metadata = watch('metadata');

  // Memoize derived maps to avoid new identity each render
  const staticServersMap = useMemo(() => {
    const list = ((serverDiscovery as any)?.servers || []) as Array<{ hostname?: string; metadata?: Record<string, any> }>;
    return Object.fromEntries(list.map((s, i) => [s.hostname || `server_${i + 1}`, s.metadata || {}]));
  }, [(serverDiscovery as any)?.servers]);

  // Optional debug logging (enable with NEXT_PUBLIC_DEBUG_FORMS=true)
  const lastDebugKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!DEBUG_FORMS) return;
    const key = JSON.stringify({ id: client?.id, serverDiscovery });
    if (lastDebugKeyRef.current === key) return;
    lastDebugKeyRef.current = key;
    // eslint-disable-next-line no-console
    console.log('🔍 Client data loaded:', { id: client?.id, name: client?.name, enabled: (client as any)?.enabled, logDirectory: (client as any)?.logDirectory, discovery: (client as any)?.discovery });
    // eslint-disable-next-line no-console
    console.log('🔍 serverDiscovery from watch:', serverDiscovery);
  }, [client?.id, client?.name, (client as any)?.enabled, (client as any)?.logDirectory, (client as any)?.discovery, serverDiscovery, DEBUG_FORMS]);

  const onSubmit = (data: ClientConfigFormData) => {
    // Sync parser rules from textarea regardless of blur
    try {
      const parsed = JSON.parse(parserRulesText || '[]');
      (data as any).parserRules = parsed;
    } catch (e) {
      toast.error('Parser Rules JSON is invalid');
      return;
    }
    updateClient.mutate({ ...data, __originalId: originalIdRef.current || undefined } as any);
  };

  const defaultClientConfig = useMemo<Partial<ClientConfigFormData>>(
    () => ({
      enabled: true,
      parserRules: [],
    }),
    []
  );

  return (
    <ConfigEditLayout
      title={`Edit Client: ${client?.name || id}`}
      subtitle="Modify the IRC client configuration"
      resourceType="client"
      listPath="/clients"
      isLoading={isLoading}
      data={client}
      form={form}
      schema={clientConfigSchema}
      isPending={updateClient.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultClientConfig}
    >
              <Card>
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                  <CardDescription>
                    Set up the client name, identifier, and whether it should be active
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="My IRC Client"
                    />
                    <p className="text-xs text-muted-foreground">
                      A friendly name to identify this client
                    </p>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id">Unique identifier</Label>
                    <Input
                      id="id"
                      {...register('id')}
                      className="font-mono"
                      placeholder="my-client-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and dashes only. Used to identify the client type
                    </p>
                    {errors.id && (
                      <p className="text-sm text-destructive">{errors.id.message}</p>
                    )}
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <Controller
                      control={form.control}
                      name="enabled"
                      render={({ field: { value = false, onChange, onBlur, ref } }) => (
                        <Switch
                          id="enabled"
                          checked={!!value}
                          onCheckedChange={onChange}
                          onBlur={onBlur}
                          ref={ref as any}
                        />
                      )}
                    />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="enabled" className="cursor-pointer">Enable this client</Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, this client will process IRC logs and trigger events
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logDirectory">Log directory path</Label>
                    <Input
                      id="logDirectory"
                      {...register('logDirectory')}
                      placeholder="/path/to/irc/logs"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Full path to where your IRC client stores log files
                    </p>
                    {errors.logDirectory && (
                      <p className="text-sm text-destructive">
                        {errors.logDirectory.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Log file discovery</CardTitle>
                  <CardDescription>Configure how to find and identify different log files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">File patterns</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Define glob patterns to match different log file types
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discovery.patterns.console" className="text-xs">Console logs</Label>
                        <Input 
                          id="discovery.patterns.console" 
                          value={(discovery as any)?.patterns?.console || ''} 
                          onChange={(e) => setValue('discovery', { ...(discovery || {}), patterns: { ...((discovery as any)?.patterns || {}), console: e.target.value } })} 
                          className="text-sm font-mono" 
                          placeholder="**/console.log"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discovery.patterns.channels" className="text-xs">Channel logs</Label>
                        <Input 
                          id="discovery.patterns.channels" 
                          value={(discovery as any)?.patterns?.channels || ''} 
                          onChange={(e) => setValue('discovery', { ...(discovery || {}), patterns: { ...((discovery as any)?.patterns || {}), channels: e.target.value } })} 
                          className="text-sm font-mono" 
                          placeholder="**/#*.log"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discovery.patterns.queries" className="text-xs">Private messages</Label>
                        <Input 
                          id="discovery.patterns.queries" 
                          value={(discovery as any)?.patterns?.queries || ''} 
                          onChange={(e) => setValue('discovery', { ...(discovery || {}), patterns: { ...((discovery as any)?.patterns || {}), queries: e.target.value } })} 
                          className="text-sm font-mono" 
                          placeholder="**/query_*.log"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Path extraction</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Use regex patterns to extract server, channel, and user names from file paths
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.serverPattern" className="text-xs">Server regex pattern</Label>
                          <Input 
                            id="discovery.pathExtraction.serverPattern" 
                            value={(discovery as any)?.pathExtraction?.serverPattern || ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), serverPattern: e.target.value } })} 
                            className="text-sm font-mono" 
                            placeholder="/([^/]+)/channels/"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.serverGroup" className="text-xs">Capture group number</Label>
                          <Input 
                            id="discovery.pathExtraction.serverGroup" 
                            type="number" 
                            value={(discovery as any)?.pathExtraction?.serverGroup ?? ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), serverGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} 
                            className="text-sm" 
                            placeholder="1"
                          />
                          <p className="text-xs text-muted-foreground">Which group in the regex contains the server name</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.channelPattern" className="text-xs">Channel regex pattern</Label>
                          <Input 
                            id="discovery.pathExtraction.channelPattern" 
                            value={(discovery as any)?.pathExtraction?.channelPattern || ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), channelPattern: e.target.value } })} 
                            className="text-sm font-mono" 
                            placeholder="/#([^.]+)\\.log$"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.channelGroup" className="text-xs">Capture group number</Label>
                          <Input 
                            id="discovery.pathExtraction.channelGroup" 
                            type="number" 
                            value={(discovery as any)?.pathExtraction?.channelGroup ?? ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), channelGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} 
                            className="text-sm" 
                            placeholder="1"
                          />
                          <p className="text-xs text-muted-foreground">Which group in the regex contains the channel name</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.queryPattern" className="text-xs">Private message regex pattern</Label>
                          <Input 
                            id="discovery.pathExtraction.queryPattern" 
                            value={(discovery as any)?.pathExtraction?.queryPattern || ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), queryPattern: e.target.value } })} 
                            className="text-sm font-mono" 
                            placeholder="/query_([^.]+)\\.log$"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discovery.pathExtraction.queryGroup" className="text-xs">Capture group number</Label>
                          <Input 
                            id="discovery.pathExtraction.queryGroup" 
                            type="number" 
                            value={(discovery as any)?.pathExtraction?.queryGroup ?? ''} 
                            onChange={(e) => setValue('discovery', { ...(discovery || {}), pathExtraction: { ...((discovery as any)?.pathExtraction || {}), queryGroup: e.target.value === '' ? undefined : Number(e.target.value) } })} 
                            className="text-sm" 
                            placeholder="1"
                          />
                          <p className="text-xs text-muted-foreground">Which group in the regex contains the user name</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Server discovery</CardTitle>
                  <CardDescription>Configure how to identify and retrieve server information from log paths</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs">Discovery method</Label>
                    <Select
                      value={(serverDiscovery as any)?.type}
                      onValueChange={(v) => {
                        const baseDiscovery = { type: v as any };
                        // Clear type-specific fields when changing type
                        if (v === 'static') {
                          setValue('serverDiscovery', { ...baseDiscovery, servers: [] });
                        } else if (v === 'filesystem') {
                          setValue('serverDiscovery', { ...baseDiscovery, searchPattern: '', hostnamePattern: '', hostnameGroup: 1 });
                        } else if (v === 'json') {
                          setValue('serverDiscovery', { ...baseDiscovery, jsonPath: '', hostnameField: 'hostname' });
                        } else if (v === 'sqlite') {
                          setValue('serverDiscovery', { ...baseDiscovery, query: '', hostnameColumn: 'hostname' });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How should servers be discovered?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="static">Static list (manually defined servers)</SelectItem>
                        <SelectItem value="filesystem">Filesystem structure (extract from paths)</SelectItem>
                        <SelectItem value="json">JSON file (client config file)</SelectItem>
                        <SelectItem value="sqlite">SQLite database (client database)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How to discover servers from the client's configuration or structure
                    </p>
                  </div>

                  {((serverDiscovery as any)?.type === 'static') && (
                    <div className="space-y-2">
                      <Label className="text-xs">Static servers</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Manually define the list of servers for this client
                      </p>
                      <KeyValueEditor
                        value={staticServersMap}
                        onChange={(obj) => setValue('serverDiscovery', { 
                          type: 'static', 
                          servers: Object.entries(obj).map(([hostname, metadata]) => ({ hostname, metadata })) 
                        })}
                        placeholderKey="irc.example.com"
                        placeholderValue="{}"
                      />
                    </div>
                  )}

                  {((serverDiscovery as any)?.type === 'filesystem') && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverDiscovery.searchPattern" className="text-xs">Search pattern</Label>
                        <Input 
                          id="serverDiscovery.searchPattern" 
                          value={(serverDiscovery as any)?.searchPattern || ''} 
                          onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), searchPattern: e.target.value })} 
                          className="text-sm font-mono" 
                          placeholder="**/servers/*"
                        />
                        <p className="text-xs text-muted-foreground">
                          Glob pattern to find server directories
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="serverDiscovery.hostnamePattern" className="text-xs">Hostname regex pattern</Label>
                          <Input 
                            id="serverDiscovery.hostnamePattern" 
                            value={(serverDiscovery as any)?.hostnamePattern || ''} 
                            onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), hostnamePattern: e.target.value })} 
                            className="text-sm font-mono" 
                            placeholder="/([^/]+)$"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="serverDiscovery.hostnameGroup" className="text-xs">Capture group number</Label>
                          <Input 
                            id="serverDiscovery.hostnameGroup" 
                            type="number" 
                            value={(serverDiscovery as any)?.hostnameGroup ?? ''} 
                            onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), hostnameGroup: e.target.value === '' ? undefined : Number(e.target.value) })} 
                            className="text-sm" 
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {((serverDiscovery as any)?.type === 'json') && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverDiscovery.jsonPath" className="text-xs">JSON file path</Label>
                        <Input 
                          id="serverDiscovery.jsonPath" 
                          value={(serverDiscovery as any)?.jsonPath || ''} 
                          onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), type: 'json', jsonPath: e.target.value })} 
                          className="text-sm font-mono" 
                          placeholder="users/admin.json"
                        />
                        <p className="text-xs text-muted-foreground">
                          Relative or absolute path to the client's server config file
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serverDiscovery.hostnameField" className="text-xs">Hostname field name</Label>
                        <Input 
                          id="serverDiscovery.hostnameField" 
                          value={(serverDiscovery as any)?.hostnameField || ''} 
                          onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), type: 'json', hostnameField: e.target.value })} 
                          className="text-sm font-mono" 
                          placeholder="host"
                        />
                        <p className="text-xs text-muted-foreground">
                          Which JSON field contains the server hostname (e.g., "host", "hostname", "server")
                        </p>
                      </div>
                    </div>
                  )}

                  {((serverDiscovery as any)?.type === 'sqlite') && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverDiscovery.query" className="text-xs">SQL query</Label>
                        <Input 
                          id="serverDiscovery.query" 
                          value={(serverDiscovery as any)?.query || ''} 
                          onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), query: e.target.value })} 
                          className="text-sm font-mono" 
                          placeholder="SELECT hostname FROM servers"
                        />
                        <p className="text-xs text-muted-foreground">
                          Query to retrieve server information
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serverDiscovery.hostnameColumn" className="text-xs">Hostname column name</Label>
                        <Input 
                          id="serverDiscovery.hostnameColumn" 
                          value={(serverDiscovery as any)?.hostnameColumn || ''} 
                          onChange={(e) => setValue('serverDiscovery', { ...(serverDiscovery || {}), hostnameColumn: e.target.value })} 
                          className="text-sm font-mono" 
                          placeholder="hostname"
                        />
                        <p className="text-xs text-muted-foreground">
                          Which column contains the hostname
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Log file format</CardTitle>
                  <CardDescription>Configure how log files should be read and parsed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>File type</Label>
                      <Select
                        value={(fileType as any)?.type}
                        onValueChange={(v) => setValue('fileType', { ...(fileType || {}), type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select file format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text file (plain logs)</SelectItem>
                          <SelectItem value="sqlite">SQLite database</SelectItem>
                          <SelectItem value="json">JSON file</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Format of your IRC log files
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fileType.encoding" className="text-xs">Character encoding</Label>
                      <Input 
                        id="fileType.encoding" 
                        value={(fileType as any)?.encoding || ''} 
                        onChange={(e) => setValue('fileType', { ...(fileType || {}), encoding: e.target.value })} 
                        className="text-sm" 
                        placeholder="utf-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: utf-8
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fileType.timestampFormat" className="text-xs">Timestamp format</Label>
                      <Input 
                        id="fileType.timestampFormat" 
                        value={(fileType as any)?.timestampFormat || ''} 
                        onChange={(e) => setValue('fileType', { ...(fileType || {}), timestampFormat: e.target.value })} 
                        className="text-sm font-mono" 
                        placeholder="YYYY-MM-DD HH:mm:ss"
                      />
                      <p className="text-xs text-muted-foreground">
                        Date/time format used in log entries
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fileType.timezone" className="text-xs">Timezone</Label>
                      <Input 
                        id="fileType.timezone" 
                        value={(fileType as any)?.timezone || ''} 
                        onChange={(e) => setValue('fileType', { ...(fileType || {}), timezone: e.target.value })} 
                        className="text-sm" 
                        placeholder="America/New_York"
                      />
                      <p className="text-xs text-muted-foreground">
                        Timezone for timestamp interpretation
                      </p>
                    </div>
                  </div>

                  {(fileType as any)?.type === 'sqlite' && (
                    <div className="space-y-2">
                      <Label htmlFor="fileType.query" className="text-xs">SQLite query</Label>
                      <Input 
                        id="fileType.query" 
                        value={(fileType as any)?.query || ''} 
                        onChange={(e) => setValue('fileType', { ...(fileType || {}), query: e.target.value })} 
                        className="text-sm font-mono" 
                        placeholder="SELECT * FROM messages ORDER BY timestamp"
                      />
                      <p className="text-xs text-muted-foreground">
                        SQL query to retrieve messages from the database
                      </p>
                    </div>
                  )}
                  
                  {(fileType as any)?.type === 'json' && (
                    <div className="space-y-2">
                      <Label htmlFor="fileType.jsonPath" className="text-xs">JSON path</Label>
                      <Input 
                        id="fileType.jsonPath" 
                        value={(fileType as any)?.jsonPath || ''} 
                        onChange={(e) => setValue('fileType', { ...(fileType || {}), jsonPath: e.target.value })} 
                        className="text-sm font-mono" 
                        placeholder="$.messages[*]"
                      />
                      <p className="text-xs text-muted-foreground">
                        JSONPath expression to locate messages in the file
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message parsing rules</CardTitle>
                  <CardDescription>Define patterns to extract information from log messages</CardDescription>
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
                        // keep text, show toast on submit if invalid
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Changes are applied when you click outside the editor. Invalid JSON will be rejected on save.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional metadata</CardTitle>
                  <CardDescription>Custom key-value pairs for this client</CardDescription>
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
