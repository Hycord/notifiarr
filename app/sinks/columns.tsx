'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { SinkConfig } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ColumnActionsProps {
  sink: SinkConfig;
  onDelete: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

function RateLimitCell({ rateLimit }: { rateLimit: any }) {
  const [expanded, setExpanded] = React.useState(false);
  
  if (!rateLimit || (!rateLimit.maxPerMinute && !rateLimit.maxPerHour)) {
    return <div className="text-sm text-muted-foreground">None</div>;
  }
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-muted-foreground hover:text-foreground truncate max-w-[150px] text-left"
        >
          {rateLimit.maxPerMinute || '∞'}/min
          <span className="ml-1 text-xs opacity-60">⨯</span>
        </button>
      </div>
      {expanded && (
        <div className="pl-3 space-y-0.5 text-xs text-muted-foreground border-l-2 border-border">
          <div>Per min: {rateLimit.maxPerMinute || '∞'}</div>
          <div>Per hour: {rateLimit.maxPerHour || '∞'}</div>
        </div>
      )}
    </div>
  );
}

function ColumnActions({ sink, onDelete, onToggle }: ColumnActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={`/sinks/${sink.id}    `}>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sink</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sink.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(sink.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const createSinkColumns = (
  onDelete: (id: string) => void,
  onToggle?: (id: string, enabled: boolean) => void
): ColumnDef<SinkConfig>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'enabled',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const enabled = row.getValue('enabled') as boolean;
      return (
        <Badge 
          variant={enabled ? 'default' : 'secondary'}
          className={onToggle ? 'cursor-pointer hover:opacity-80' : ''}
          onClick={() => onToggle?.(row.original.id, !enabled)}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue('type')}</Badge>
    ),
  },
  {
    accessorKey: 'rateLimit',
    header: 'Rate Limits',
    cell: ({ row }) => <RateLimitCell rateLimit={row.getValue('rateLimit') as any} />,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <ColumnActions sink={row.original} onDelete={onDelete} onToggle={onToggle} />,
  },
];
