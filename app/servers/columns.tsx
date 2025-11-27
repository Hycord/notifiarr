'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ServerConfig } from '@/lib/types';
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
  server: ServerConfig;
  onDelete: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

function ColumnActions({ server, onDelete }: ColumnActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Link href={`/servers/${server.id}`}>
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
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{server.displayName}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(server.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const createServerColumns = (
  onDelete: (id: string) => void,
  onToggle?: (id: string, enabled: boolean) => void
): ColumnDef<ServerConfig>[] => [
  {
    accessorKey: 'displayName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Display Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('displayName')}</div>,
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
    accessorKey: 'hostname',
    header: 'Hostname',
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue('hostname')}</div>
    ),
  },
  {
    accessorKey: 'network',
    header: 'Network',
    cell: ({ row }) => {
      const network = row.getValue('network') as string | undefined;
      return <Badge variant="outline">{network || 'N/A'}</Badge>;
    },
  },
  {
    accessorKey: 'clientNickname',
    header: 'Client Nickname',
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <ColumnActions server={row.original} onDelete={onDelete} />,
  },
];
