'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateServer } from '@/hooks/use-config-queries';
import { serverConfigSchema, type ServerConfigFormData, createSlug } from '@/lib/schemas';
import { ConfigEditLayout } from '@/components/config-edit-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyValueEditor } from '@/components/forms/key-value-editor';
import { UsersEditor } from '@/components/forms/users-editor';

export default function NewServerPage() {
  const router = useRouter();
  const form = useForm<ServerConfigFormData>({
    resolver: zodResolver(serverConfigSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      hostname: '',
      displayName: '',
      clientNickname: '',
      enabled: true,
      network: '',
      port: 6667,
      tls: false,
      users: {},
      metadata: {},
    },
  });
  const { register, watch, setValue, formState: { errors } } = form;
  const enabled = watch('enabled');
  const tls = watch('tls');
  const users = watch('users');
  const metadata = watch('metadata');

  const createServer = useCreateServer({
    onSuccess: () => {
      toast.success('Server created successfully');
      router.push('/servers');
    },
    onError: (error) => toast.error(`Failed to create server: ${error.message}`),
  });

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setValue('displayName', newName);
    if (!watch('id')) setValue('id', createSlug(newName));
  };

  const onSubmit = (data: ServerConfigFormData) => {
    createServer.mutate(data);
  };

  const defaultServerConfig: Partial<ServerConfigFormData> = {
    enabled: true,
    tls: false,
    port: 6667,
    users: {},
    metadata: {},
  };

  return (
    <ConfigEditLayout
      title="New Server"
      subtitle="Create a new IRC server configuration"
      resourceType="server"
      listPath="/servers"
      isLoading={false}
      data={undefined}
      form={form}
      schema={serverConfigSchema}
      isPending={createServer.isPending}
      onSubmit={onSubmit}
      defaultConfig={defaultServerConfig}
      createMode
    >
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>Set up the server connection details and display name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...register('displayName')}
                    onChange={handleDisplayNameChange}
                    placeholder="Libera Chat"
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive">{errors.displayName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    {...register('id')}
                    placeholder="libera-chat"
                    className="font-mono"
                  />
                  {errors.id && (
                    <p className="text-sm text-destructive">{errors.id.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    {...register('hostname')}
                    placeholder="irc.libera.chat"
                    className="font-mono"
                  />
                  {errors.hostname && (
                    <p className="text-sm text-destructive">{errors.hostname.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <Input
                    id="network"
                    {...register('network')}
                    placeholder="Libera"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientNickname">Client Nickname</Label>
                  <Input
                    id="clientNickname"
                    {...register('clientNickname')}
                    placeholder="mynick"
                  />
                  {errors.clientNickname && (
                    <p className="text-sm text-destructive">
                      {errors.clientNickname.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    {...register('port', { valueAsNumber: true })}
                    placeholder="6667"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Switch id="enabled" checked={enabled} onCheckedChange={(checked) => setValue('enabled', checked)} />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="enabled" className="cursor-pointer">Enable this server</Label>
                    <p className="text-xs text-muted-foreground">When enabled, this server will be monitored for IRC events</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Switch id="tls" checked={tls} onCheckedChange={(checked) => setValue('tls', checked)} />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="tls" className="cursor-pointer">Use TLS/SSL encryption</Label>
                    <p className="text-xs text-muted-foreground">Enable secure connection to the IRC server</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Known users</CardTitle>
              <CardDescription>Configure known bot accounts in this server</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersEditor value={users as any} onChange={(next) => setValue('users', next as any)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Additional metadata</CardTitle>
              <CardDescription>Custom key-value pairs for this server</CardDescription>
            </CardHeader>
            <CardContent>
              <KeyValueEditor
                value={metadata as any}
                onChange={(next) => setValue('metadata', next as any)}
                placeholderKey="key"
                placeholderValue="value (JSON or text)"
              />
              <p className="text-xs text-muted-foreground mt-2">Store any additional configuration specific to your setup</p>
            </CardContent>
          </Card>
    </ConfigEditLayout>
  );
}
