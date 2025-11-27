'use client';

import { useServers, useDeleteServer, useUpdateServer } from '@/hooks/use-config-queries';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { createServerColumns } from './columns';
import { Plus, Server } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ServersPage() {
  const { data: servers, isLoading, error, isError } = useServers();
  const deleteServer = useDeleteServer({
    onSuccess: () => {
      toast.success('Server deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete server: ${error.message}`);
    },
  });

  const updateServer = useUpdateServer({
    onSuccess: () => {
      toast.success('Server status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update server: ${error.message}`);
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    const server = servers?.find(s => s.id === id);
    if (server) {
      updateServer.mutate({ ...server, enabled });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Servers</h2>
          </div>
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Servers</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Servers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Servers</h2>
            <p className="text-muted-foreground">
              Manage IRC server configurations
            </p>
          </div>
          <Link href="/servers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Server
            </Button>
          </Link>
        </div>

        {!servers || servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No servers configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first IRC server configuration.
            </p>
            <Link href="/servers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Server
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            columns={createServerColumns(
              (id) => deleteServer.mutate(id),
              handleToggle
            )}
            data={servers}
            searchKey="displayName"
            searchPlaceholder="Search servers..."
          />
        )}
      </div>
    </AppLayout>
  );
}
