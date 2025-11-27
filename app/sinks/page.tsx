'use client';

import { useSinks, useDeleteSink, useUpdateSink } from '@/hooks/use-config-queries';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { createSinkColumns } from './columns';
import { Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SinksPage() {
  const { data: sinks, isLoading, error, isError } = useSinks();
  const deleteSink = useDeleteSink({
    onSuccess: () => toast.success('Sink deleted successfully'),
    onError: (error) => toast.error(`Failed to delete sink: ${error.message}`),
  });

  const updateSink = useUpdateSink({
    onSuccess: () => toast.success('Sink status updated'),
    onError: (error) => toast.error(`Failed to update sink: ${error.message}`),
  });

  const handleToggle = (id: string, enabled: boolean) => {
    const sink = sinks?.find(s => s.id === id);
    if (sink) {
      updateSink.mutate({ ...sink, enabled });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Sinks</h2>
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
          <h2 className="text-3xl font-bold">Sinks</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Sinks</h3>
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
            <h2 className="text-3xl font-bold">Sinks</h2>
            <p className="text-muted-foreground">Manage notification destinations</p>
          </div>
          <Link href="/sinks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sink
            </Button>
          </Link>
        </div>

        {!sinks || sinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sinks configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first notification sink.
            </p>
            <Link href="/sinks/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Sink
              </Button>
            </Link>
          </div>
        ) : (
          <DataTable
            columns={createSinkColumns(
              (id) => deleteSink.mutate(id),
              handleToggle
            )}
            data={sinks}
            searchKey="name"
            searchPlaceholder="Search sinks..."
          />
        )}
      </div>
    </AppLayout>
  );
}
