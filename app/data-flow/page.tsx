'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataFlow } from '@/hooks/use-config-queries';
import { DataFlowChartCard } from '@/components/data-flow-chart-card';
import { DataTable } from '@/components/data-table';
import { columns } from './routing-paths-columns';
import { Loader2, AlertCircle, Activity, Database, Zap, Bell, Filter } from 'lucide-react';

export default function DataFlowPage() {
  const { data, isLoading, error, refetch, isRefetching } = useDataFlow();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading data flow...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load data flow: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, routingPaths } = data;

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Data Flow</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Visualize how messages flow through your IRC notification system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.enabledClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients} total
              {stats.totalParserRules > 0 && ` · ${stats.totalParserRules} parser rules`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.enabledServers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalServers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.enabledEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEvents} total
              {stats.eventsWithFilters > 0 && ` · ${stats.eventsWithFilters} with filters`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinks</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.enabledSinks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSinks} total
              {stats.sinksWithTemplates > 0 && ` · ${stats.sinksWithTemplates} with templates`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flow Chart */}
      <DataFlowChartCard 
        data={data} 
        showDetailedDescription 
      />

      {/* Routing Paths Table */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Paths</CardTitle>
          <CardDescription>
            All possible message routing paths in your configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={routingPaths}
            searchPlaceholder="Search clients, servers, events, or sinks..."
            globalFilterFn={(row, filterValue) => {
              const searchValue = filterValue.toLowerCase();
              return (
                row.clientName.toLowerCase().includes(searchValue) ||
                row.serverName.toLowerCase().includes(searchValue) ||
                row.eventName.toLowerCase().includes(searchValue) ||
                row.sinkNames.some((sink: string) => sink.toLowerCase().includes(searchValue)) ||
                (row.filterSummary?.toLowerCase().includes(searchValue) ?? false)
              );
            }}
          />
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
