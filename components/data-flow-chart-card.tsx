'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SystemStatusBadge } from '@/components/system-status-badge';
import { DataFlowChart } from '@/app/data-flow/data-flow-chart';
import { DataFlowResponse } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

interface DataFlowChartCardProps {
  data: DataFlowResponse;
  showDetailedDescription?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DataFlowChartCard({ data, showDetailedDescription = false, onRefresh, isRefreshing = false }: DataFlowChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <CardTitle className="text-xl">Message Flow Visualization</CardTitle>
            <CardDescription>
              {showDetailedDescription
                ? 'Click any node to highlight all routing paths that pass through it. Click again or on the background to deselect. Use mouse/touch to pan and zoom.'
                : 'Click any node to highlight all routing paths that pass through it'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SystemStatusBadge isRunning={data.running} />
            <div className="flex items-center gap-2 text-sm shrink-0">
              <span className="font-semibold">{data.stats.enabledRoutingPaths}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{data.stats.totalRoutingPaths}</span>
              <span className="text-muted-foreground">paths</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <DataFlowChart data={data} />
      </CardContent>
    </Card>
  );
}
