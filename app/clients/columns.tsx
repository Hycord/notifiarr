'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ClientConfig } from '@/lib/types';
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
  client: ClientConfig;
  onDelete: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

function ColumnActions({ client, onDelete }: ColumnActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={`/clients/${client.id}`}>
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
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{client.name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(client.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const createClientColumns = (
  onDelete: (id: string) => void,
  onToggle?: (id: string, enabled: boolean) => void
): ColumnDef<ClientConfig>[] => [
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
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue('id')}</div>
    ),
  },
  {
    accessorKey: 'logDirectory',
    header: 'Log Directory',
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue('logDirectory')}</div>
    ),
  },
  {
    accessorKey: 'parserRules',
    header: 'Parser Rules',
    cell: ({ row }) => {
      const rules = row.getValue('parserRules') as any[];
      return <div>{rules?.length || 0}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <ColumnActions client={row.original} onDelete={onDelete} onToggle={onToggle} />,
  },
];
