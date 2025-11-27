'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useServer, useUpdateServer } from '@/hooks/use-config-queries';
import { serverConfigSchema, type ServerConfigFormData } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRef, useEffect } from 'react';
import { UsersEditor } from '@/components/forms/users-editor';
import { KeyValueEditor } from '@/components/forms/key-value-editor';

export default function EditServerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const originalIdRef = useRef<string | null>(null);

  const { data: server, isLoading } = useServer(id);
  
  // Track original ID when server data loads
  useEffect(() => {
    if (server?.id && !originalIdRef.current) {
      originalIdRef.current = server.id;
    }
  }, [server]);

  const updateServer = useUpdateServer({
    onSuccess: (_, variables) => {
      toast.success('Server updated successfully');
      // If ID changed, redirect to new ID
      if (originalIdRef.current && variables.id !== originalIdRef.current) {
        router.push(`/servers/${variables.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update server: ${error.message}`);
    },
  });

  const form = useForm<ServerConfigFormData>({
    resolver: zodResolver(serverConfigSchema),
    mode: 'onChange',
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const enabled = watch('enabled');
  const tls = watch('tls');
  const users = watch('users');
  const metadata = watch('metadata');

  const onSubmit = (data: ServerConfigFormData) => {
    console.log('[Server Edit] Submitting data:', data);
    console.log('[Server Edit] Original ID:', originalIdRef.current);
    updateServer.mutate({ ...data, __originalId: originalIdRef.current || undefined } as any);
  };

  const defaultServerConfig: Partial<ServerConfigFormData> = {
    enabled: true,
    tls: false,
    port: 6667,
    network: '',
    users: {},
    metadata: {},
  };

  return (
    <ConfigEditLayout
      title={`Edit Server: ${server?.displayName || id}`}
      subtitle="Modify the IRC server configuration"
      resourceType="server"
      listPath="/servers"
      isLoading={isLoading}
      data={server}
      form={form}
      schema={serverConfigSchema}
      isPending={updateServer.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultServerConfig}
    >
              <Card>
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                  <CardDescription>
                    Set up the server connection details and display name
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                      id="displayName"
                      {...register('displayName')}
                      placeholder="My IRC Server"
                    />
                    <p className="text-xs text-muted-foreground">
                      A friendly name to identify this server
                    </p>
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostname">Server hostname</Label>
                    <Input
                      id="hostname"
                      {...register('hostname')}
                      placeholder="irc.example.com"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The IRC server address to connect to
                    </p>
                    {errors.hostname && (
                      <p className="text-sm text-destructive">{errors.hostname.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="port">Port number</Label>
                      <Input
                        id="port"
                        type="number"
                        {...register('port', { valueAsNumber: true })}
                        placeholder="6667"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 6667 (non-SSL) or 6697 (SSL)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network">Network name</Label>
                      <Input
                        id="network"
                        {...register('network')}
                        placeholder="Libera.Chat"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: IRC network identifier
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientNickname">User Nickname</Label>
                    <Input
                      id="clientNickname"
                      {...register('clientNickname')}
                      placeholder="mybot"
                    />
                    <p className="text-xs text-muted-foreground">
                      The nickname you use on this server
                    </p>
                    {errors.clientNickname && (
                      <p className="text-sm text-destructive">{errors.clientNickname.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id">Unique identifier</Label>
                    <Input
                      id="id"
                      {...register('id')}
                      className="font-mono"
                      placeholder="my-server-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and dashes only. Used in configuration files
                    </p>
                    {errors.id && (
                      <p className="text-sm text-destructive">{errors.id.message}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <Switch
                        id="enabled"
                        checked={enabled}
                        onCheckedChange={(checked) => setValue('enabled', checked)}
                      />
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="enabled" className="cursor-pointer">Enable this server</Label>
                        <p className="text-xs text-muted-foreground">
                          When enabled, this server will be monitored for IRC events
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <Switch
                        id="tls"
                        checked={tls}
                        onCheckedChange={(checked) => setValue('tls', checked)}
                      />
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="tls" className="cursor-pointer">Use TLS/SSL encryption</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable secure connection to the IRC server
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Known users</CardTitle>
                  <CardDescription>
                    Configure known bot accounts in this server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersEditor
                    value={users as any}
                    onChange={(next) => setValue('users', next as any)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional metadata</CardTitle>
                  <CardDescription>
                    Custom key-value pairs for this server
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
