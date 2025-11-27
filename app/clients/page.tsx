'use client';

import { useClients, useDeleteClient, useUpdateClient } from '@/hooks/use-config-queries';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { createClientColumns } from './columns';
import { Plus, Radio } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { data: clients, isLoading, error, isError } = useClients();
  const deleteClient = useDeleteClient({
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

  const updateClient = useUpdateClient({
    onSuccess: () => {
      toast.success('Client status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    const client = clients?.find(c => c.id === id);
    if (client) {
      updateClient.mutate({ ...client, enabled });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Clients</h2>
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
          <h2 className="text-3xl font-bold">Clients</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Clients</h3>
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
            <h2 className="text-3xl font-bold">Clients</h2>
            <p className="text-muted-foreground">
              Manage IRC client log parsers
            </p>
          </div>
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first IRC client configuration to start monitoring logs.
            </p>
            <Link href="/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            columns={createClientColumns(
              (id) => deleteClient.mutate(id),
              handleToggle
            )}
            data={clients}
            searchKey="name"
            searchPlaceholder="Search clients..."
          />
        )}
      </div>
    </AppLayout>
  );
}
