'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataFlowRoutingPath } from '@/lib/types';
import { ArrowDown, Filter } from 'lucide-react';

export const columns: ColumnDef<DataFlowRoutingPath>[] = [
  {
    id: 'flow',
    header: 'Message Flow',
    cell: ({ row }) => {
      const isEnabled = row.original.enabled;
      const arrowColor = isEnabled ? 'text-green-600' : 'text-muted-foreground';
      
      return (
        <div className="flex flex-col items-center gap-2 py-2 min-w-[200px]">
          <Badge 
            variant="outline" 
            className="w-full justify-center"
            style={{ opacity: row.original.clientEnabled ? 1 : 0.4 }}
          >
            {row.original.clientName}
          </Badge>
          <ArrowDown className={`h-4 w-4 ${arrowColor}`} />
          <Badge 
            variant="outline" 
            className="w-full justify-center"
            style={{ opacity: row.original.serverEnabled ? 1 : 0.4 }}
          >
            {row.original.serverName}
          </Badge>
          <ArrowDown className={`h-4 w-4 ${arrowColor}`} />
          <Badge 
            variant="secondary" 
            className="w-full justify-center"
            style={{ opacity: row.original.eventEnabled ? 1 : 0.4 }}
          >
            {row.original.eventName}
            {row.original.hasFilters && <Filter className="inline ml-1 h-3 w-3" />}
          </Badge>
          <ArrowDown className={`h-4 w-4 ${arrowColor}`} />
          <div className="flex flex-wrap gap-1 justify-center w-full">
            {row.original.sinkStatuses.map((sink, i) => (
              <Badge 
                key={i} 
                variant="default" 
                className="text-xs"
                style={{ opacity: sink.enabled ? 1 : 0.4 }}
              >
                {sink.name}
              </Badge>
            ))}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <Badge 
        variant="outline"
        style={{ opacity: row.original.clientEnabled ? 1 : 0.4 }}
      >
        {row.original.clientName}
      </Badge>
    ),
  },
  {
    accessorKey: 'serverName',
    header: 'Server',
    cell: ({ row }) => (
      <Badge 
        variant="outline"
        style={{ opacity: row.original.serverEnabled ? 1 : 0.4 }}
      >
        {row.original.serverName}
      </Badge>
    ),
  },
  {
    accessorKey: 'eventName',
    header: 'Event',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary"
          style={{ opacity: row.original.eventEnabled ? 1 : 0.4 }}
        >
          {row.original.eventName}
        </Badge>
        {row.original.hasFilters && <Filter className="h-3 w-3 text-muted-foreground" />}
      </div>
    ),
  },
  {
    accessorKey: 'sinkNames',
    header: 'Sinks',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.sinkStatuses.map((sink, i) => (
          <Badge 
            key={i} 
            variant="default" 
            className="text-xs"
            style={{ opacity: sink.enabled ? 1 : 0.4 }}
          >
            {sink.name}
          </Badge>
        ))}
      </div>
    ),
    filterFn: (row, id, value) => {
      const sinkNames = row.original.sinkStatuses.map(s => s.name);
      return value.some((v: string) => sinkNames.includes(v));
    },
  },
  {
    accessorKey: 'filterSummary',
    header: 'Filter',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground max-w-xs truncate block">
        {row.original.filterSummary || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'enabled',
    header: 'Status',
    cell: ({ row }) => (
      <Badge 
        variant={row.original.enabled ? 'default' : 'secondary'}
        className={row.original.enabled ? 'bg-green-600 hover:bg-green-700' : 'opacity-40'}
      >
        {row.original.enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  },
];
