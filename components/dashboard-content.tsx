'use client';

import { useClients, useServers, useEvents, useSinks, useStatus, useDataFlow } from '@/hooks/use-config-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Server, Zap, Send, Plus, AlertCircle, ExternalLink, Activity } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SystemStatusBadge } from '@/components/system-status-badge';
import { DataFlowChartCard } from '@/components/data-flow-chart-card';

export function DashboardContent() {
  const { data: status, isLoading: statusLoading, dataUpdatedAt } = useStatus();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: servers, isLoading: serversLoading } = useServers();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: sinks, isLoading: sinksLoading } = useSinks();
  const { data: dataFlow, isLoading: dataFlowLoading, refetch: refetchDataFlow, isRefetching: isRefetchingDataFlow } = useDataFlow();

  const isLoading = statusLoading || clientsLoading || serversLoading || eventsLoading || sinksLoading;

  const enabledClients = clients?.filter((c) => c.enabled).length || 0;
  const enabledServers = servers?.filter((s) => s.enabled).length || 0;
  const enabledEvents = events?.filter((e) => e.enabled).length || 0;
  const enabledSinks = sinks?.filter((s) => s.enabled).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          {status?.status.reloading && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              ⟳ Reloading
            </Badge>
          )}
          <SystemStatusBadge
            isRunning={status?.status.running ?? false}
            dataUpdatedAt={dataUpdatedAt}
          />
        </div>
      </div>

      {!status?.status.running && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The system is not currently running. Configurations can still be managed.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration Overview</CardTitle>
          <CardDescription>Total and enabled configurations by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/clients" className="group">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-md bg-primary/10">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Clients</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{enabledClients}</p>
                    <p className="text-lg text-muted-foreground">/</p>
                    <p className="text-lg text-muted-foreground">{clients?.length || 0}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/servers" className="group">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-md bg-primary/10">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Servers</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{enabledServers}</p>
                    <p className="text-lg text-muted-foreground">/</p>
                    <p className="text-lg text-muted-foreground">{servers?.length || 0}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/events" className="group">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-md bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Events</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{enabledEvents}</p>
                    <p className="text-lg text-muted-foreground">/</p>
                    <p className="text-lg text-muted-foreground">{events?.length || 0}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/sinks" className="group">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="p-2 rounded-md bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Sinks</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{enabledSinks}</p>
                    <p className="text-lg text-muted-foreground">/</p>
                    <p className="text-lg text-muted-foreground">{sinks?.length || 0}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {!dataFlowLoading && dataFlow && (
        <DataFlowChartCard data={dataFlow} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:sticky md:top-20 md:self-start">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Create new configurations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/clients/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </Link>
            <Link href="/servers/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Server
              </Button>
            </Link>
            <Link href="/events/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
            <Link href="/sinks/new">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Sink
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current configuration status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start justify-between text-sm gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">Config Directory</span>
              <div className="font-mono text-xs whitespace-nowrap overflow-x-auto min-w-0">
                {status?.status.configDirectory}
              </div>
            </div>
            {status?.status.configPath && (
              <div className="flex items-start justify-between text-sm gap-3 min-w-0">
                <span className="text-muted-foreground shrink-0">Config File</span>
                <div className="font-mono text-xs whitespace-nowrap overflow-x-auto min-w-0">
                  {status.status.configPath}
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Watchers</span>
              <span className="font-semibold">{status?.status.watchers || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Configs</span>
              <span className="font-semibold">
                {(status?.status.clients.total || 0) + (status?.status.servers.total || 0) + 
                 (status?.status.events.total || 0) + (status?.status.sinks.total || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Enabled Configs</span>
              <span className="font-semibold">
                {(status?.status.clients.enabled || 0) + (status?.status.servers.enabled || 0) + 
                 (status?.status.events.enabled || 0) + (status?.status.sinks.enabled || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
