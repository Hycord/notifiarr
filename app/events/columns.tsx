'use client';

import { ColumnDef } from '@tanstack/react-table';
import { EventConfig } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
  event: EventConfig;
  onDelete: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

function ColumnActions({ event, onDelete, onToggle }: ColumnActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={`/events/${event.id}`}>
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
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(event.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper type for table rows (groups + events)
export type EventTableRow = EventConfig | { 
  id: string; 
  isGroup: true; 
  groupName: string; 
  events: EventConfig[];
};

export function isGroupRow(row: EventTableRow): row is { id: string; isGroup: true; groupName: string; events: EventConfig[] } {
  return 'isGroup' in row && row.isGroup === true;
}

// Process events into groups
export function processEventsIntoRows(events: EventConfig[]): EventTableRow[] {
  const grouped = new Map<string, EventConfig[]>();
  const ungrouped: EventConfig[] = [];

  events.forEach(event => {
    if (event.group) {
      if (!grouped.has(event.group)) {
        grouped.set(event.group, []);
      }
      grouped.get(event.group)!.push(event);
    } else {
      ungrouped.push(event);
    }
  });

  // Create items with priority for sorting (both groups and ungrouped events)
  type SortableItem = 
    | { type: 'event'; priority: number; event: EventConfig }
    | { type: 'group'; priority: number; groupName: string; events: EventConfig[] };
  
  const sortableItems: SortableItem[] = [];
  
  // Add ungrouped events
  ungrouped.forEach(event => {
    sortableItems.push({
      type: 'event',
      priority: event.priority || 0,
      event,
    });
  });
  
  // Add groups (use highest priority in group for sorting)
  grouped.forEach((groupEvents, groupName) => {
    groupEvents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const maxPriority = Math.max(...groupEvents.map(e => e.priority || 0));
    sortableItems.push({
      type: 'group',
      priority: maxPriority,
      groupName,
      events: groupEvents,
    });
  });
  
  // Sort all items by priority (highest first)
  sortableItems.sort((a, b) => b.priority - a.priority);
  
  // Convert to EventTableRow format
  const rows: EventTableRow[] = sortableItems.map(item => {
    if (item.type === 'event') {
      return item.event;
    } else {
      return {
        id: `group-${item.groupName}`,
        isGroup: true,
        groupName: item.groupName,
        events: item.events,
      };
    }
  });

  return rows;
}

interface GroupRowProps {
  groupName: string;
  events: EventConfig[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function GroupRow({ groupName, isExpanded, events }: GroupRowProps) {
  return (
    <div className="font-medium flex items-center gap-2">
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      {groupName}
      <Badge variant="secondary" className="ml-2">
        {events.length} event{events.length !== 1 ? 's' : ''}
      </Badge>
    </div>
  );
}

export const createEventColumns = (
  onDelete: (id: string) => void,
  onToggle?: (id: string, enabled: boolean) => void,
  expandedGroups?: Set<string>,
  onToggleGroup?: (groupName: string) => void
): ColumnDef<EventTableRow>[] => [
  {
    accessorKey: 'priority',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      const priority = row.getValue('priority') as number | undefined;
      return <div className={rowData.group ? 'pl-8 text-right' : ''}><Badge variant="secondary">{priority || 0}</Badge></div>;
    },
  },
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
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) {
        const isExpanded = expandedGroups?.has(rowData.groupName) || false;
        return (
          <div onClick={() => onToggleGroup?.(rowData.groupName)} className="cursor-pointer">
            <GroupRow 
              groupName={rowData.groupName} 
              events={rowData.events}
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleGroup?.(rowData.groupName)}
            />
          </div>
        );
      }
      return <div className={`font-medium ${rowData.group ? 'text-right' : ''}`}>{row.getValue('name')}</div>;
    },
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
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      const enabled = row.getValue('enabled') as boolean;
      return (
        <div className={rowData.group ? 'text-right' : ''}>
          <Badge 
            variant={enabled ? 'default' : 'secondary'}
            className={onToggle ? 'cursor-pointer hover:opacity-80' : ''}
            onClick={() => onToggle?.(rowData.id, !enabled)}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'baseEvent',
    header: 'Base Event',
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      return <div className={rowData.group ? 'text-right' : ''}><Badge variant="outline">{row.getValue('baseEvent')}</Badge></div>;
    },
  },
  {
    accessorKey: 'serverIds',
    header: 'Servers',
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      const serverIds = row.getValue('serverIds') as string[];
      return (
        <div className={`text-sm text-muted-foreground ${rowData.group ? 'text-right' : ''}`}>
          {serverIds?.length || 0} server(s)
        </div>
      );
    },
  },
  {
    accessorKey: 'sinkIds',
    header: 'Sinks',
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      const sinkIds = row.getValue('sinkIds') as string[];
      return (
        <div className={`text-sm text-muted-foreground ${rowData.group ? 'text-right' : ''}`}>
          {sinkIds?.length || 0} sink(s)
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const rowData = row.original;
      if (isGroupRow(rowData)) return null;
      return <ColumnActions event={rowData} onDelete={onDelete} onToggle={onToggle} />;
    },
  },
];
