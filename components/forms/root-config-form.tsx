"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ircNotifyConfigSchema, type IRCNotifyConfigFormData } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface RootConfigFormProps {
  value?: IRCNotifyConfigFormData | null;
  onSubmit: (data: IRCNotifyConfigFormData) => void;
  isSubmitting?: boolean;
}

export function RootConfigForm({ value, onSubmit, isSubmitting }: RootConfigFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IRCNotifyConfigFormData>({
    resolver: zodResolver(ircNotifyConfigSchema) as any,
    defaultValues: (value as IRCNotifyConfigFormData | undefined) || {
      global: {},
      api: {},
    },
  });

  const global = watch('global');
  const api = watch('api');

  useEffect(() => {
    if (value) {
      reset(value);
    }
  }, [value, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>Defaults and runtime behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="global.defaultLogDirectory">Default Log Directory</Label>
              <Input
                id="global.defaultLogDirectory"
                value={global?.defaultLogDirectory || ''}
                onChange={(e) => setValue('global', { ...(global || {}), defaultLogDirectory: e.target.value })}
                placeholder="/var/log/irc"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="global.pollInterval">Poll Interval (ms)</Label>
              <Input
                id="global.pollInterval"
                type="number"
                value={global?.pollInterval ?? ''}
                onChange={(e) => setValue('global', { ...(global || {}), pollInterval: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="5000"
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="global.debug"
                checked={global?.debug || false}
                onCheckedChange={(checked) => setValue('global', { ...(global || {}), debug: checked })}
              />
              <Label htmlFor="global.debug">Debug Mode</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="global.configDirectory">Config Directory</Label>
              <Input
                id="global.configDirectory"
                value={global?.configDirectory || ''}
                onChange={(e) => setValue('global', { ...(global || {}), configDirectory: e.target.value })}
                placeholder="/etc/irc-notify"
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="global.rescanLogsOnStartup"
                checked={global?.rescanLogsOnStartup || false}
                onCheckedChange={(checked) => setValue('global', { ...(global || {}), rescanLogsOnStartup: checked })}
              />
              <Label htmlFor="global.rescanLogsOnStartup">Rescan Logs On Startup</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>Embedded HTTP API configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="api.enabled"
                checked={api?.enabled || false}
                onCheckedChange={(checked) => setValue('api', { ...(api || {}), enabled: checked })}
              />
              <Label htmlFor="api.enabled">Enabled</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api.port">Port</Label>
              <Input
                id="api.port"
                type="number"
                value={api?.port ?? ''}
                onChange={(e) => setValue('api', { ...(api || {}), port: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="3000"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api.host">Host</Label>
              <Input
                id="api.host"
                value={api?.host || ''}
                onChange={(e) => setValue('api', { ...(api || {}), host: e.target.value })}
                placeholder="0.0.0.0"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api.authToken">Auth Token</Label>
              <Input
                id="api.authToken"
                value={api?.authToken || ''}
                onChange={(e) => setValue('api', { ...(api || {}), authToken: e.target.value })}
                placeholder="(optional)"
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="api.enableFileOps"
                checked={api?.enableFileOps || false}
                onCheckedChange={(checked) => setValue('api', { ...(api || {}), enableFileOps: checked })}
              />
              <Label htmlFor="api.enableFileOps">Enable File Ops</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : 'Save Root Config'}
        </Button>
      </div>
    </form>
  );
}
