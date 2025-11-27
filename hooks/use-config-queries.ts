'use client';

import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { StatusResponse, ReloadResponse } from '@/lib/types';
import type {
  ClientConfigFormData,
  ServerConfigFormData,
  EventConfigFormData,
  SinkConfigFormData,
} from '@/lib/schemas';

// Query keys for cache management
export const queryKeys = {
  all: ['config'] as const,
  status: () => [...queryKeys.all, 'status'] as const,
  files: () => [...queryKeys.all, 'files'] as const,
  dataFlow: () => [...queryKeys.all, 'dataFlow'] as const,
  
  clients: () => [...queryKeys.all, 'clients'] as const,
  clientsList: () => [...queryKeys.clients(), 'list'] as const,
  client: (id: string) => [...queryKeys.clients(), id] as const,
  
  servers: () => [...queryKeys.all, 'servers'] as const,
  serversList: () => [...queryKeys.servers(), 'list'] as const,
  server: (id: string) => [...queryKeys.servers(), id] as const,
  
  events: () => [...queryKeys.all, 'events'] as const,
  eventsList: () => [...queryKeys.events(), 'list'] as const,
  event: (id: string) => [...queryKeys.events(), id] as const,
  
  sinks: () => [...queryKeys.all, 'sinks'] as const,
  sinksList: () => [...queryKeys.sinks(), 'list'] as const,
  sink: (id: string) => [...queryKeys.sinks(), id] as const,

  mainConfig: () => [...queryKeys.all, 'mainConfig'] as const,
};

// Status
export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status(),
    queryFn: async () => {
      try {
        return await api.status();
      } catch (error) {
        console.error('[useStatus] Error:', error);
        toast.error(`Failed to load status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

// Data Flow
export function useDataFlow() {
  return useQuery({
    queryKey: queryKeys.dataFlow(),
    queryFn: async () => {
      try {
        return await api.dataFlow();
      } catch (error) {
        console.error('[useDataFlow] Error:', error);
        toast.error(`Failed to load data flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true, // Always refresh when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Consider data immediately stale to ensure fresh fetches
    gcTime: 0, // Don't cache data - always fetch fresh
  });
}

// Files list
export function useConfigFiles() {
  return useQuery({
    queryKey: queryKeys.files(),
    queryFn: async () => {
      try {
        return await api.files.list();
      } catch (error) {
        console.error('[useConfigFiles] Error:', error);
        toast.error(`Failed to load config files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

// Clients
export function useClients() {
  return useQuery({
    queryKey: queryKeys.clientsList(),
    queryFn: async () => {
      try {
        return await api.clients.list();
      } catch (error) {
        console.error('[useClients] Error:', error);
        toast.error(`Failed to load clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => api.clients.get(id),
    enabled: !!id,
  });
}

export function useCreateClient(options?: UseMutationOptions<unknown, Error, ClientConfigFormData>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.clients.create,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

export function useUpdateClient(options?: UseMutationOptions<unknown, Error, ClientConfigFormData & { __originalId?: string }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: (variables) => api.clients.update(variables, variables.__originalId),
    onSuccess: async (data, variables, ...rest) => {
      if (variables.__originalId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.__originalId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useUpdateClientWithIdChange(options?: UseMutationOptions<unknown, Error, { oldId: string; config: ClientConfigFormData }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: ({ oldId, config }) => api.clients.updateWithIdChange(oldId, config),
    onSuccess: async (data, variables, ...rest) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.oldId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.client(variables.config.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useDeleteClient(options?: UseMutationOptions<unknown, Error, string>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.clients.delete,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Servers
export function useServers() {
  return useQuery({
    queryKey: queryKeys.serversList(),
    queryFn: async () => {
      try {
        return await api.servers.list();
      } catch (error) {
        console.error('[useServers] Error:', error);
        toast.error(`Failed to load servers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

export function useServer(id: string) {
  return useQuery({
    queryKey: queryKeys.server(id),
    queryFn: () => api.servers.get(id),
    enabled: !!id,
  });
}

export function useCreateServer(options?: UseMutationOptions<unknown, Error, ServerConfigFormData>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.servers.create,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.serversList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

export function useUpdateServer(options?: UseMutationOptions<unknown, Error, ServerConfigFormData & { __originalId?: string }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: (variables) => api.servers.update(variables, variables.__originalId),
    onSuccess: async (data, variables, ...rest) => {
      if (variables.__originalId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.server(variables.__originalId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.server(variables.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.serversList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useUpdateServerWithIdChange(options?: UseMutationOptions<unknown, Error, { oldId: string; config: ServerConfigFormData }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: ({ oldId, config }) => api.servers.updateWithIdChange(oldId, config),
    onSuccess: async (data, variables, ...rest) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.server(variables.oldId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.server(variables.config.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.serversList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useDeleteServer(options?: UseMutationOptions<unknown, Error, string>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.servers.delete,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.serversList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Events
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.eventsList(),
    queryFn: async () => {
      try {
        return await api.events.list();
      } catch (error) {
        console.error('[useEvents] Error:', error);
        toast.error(`Failed to load events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: () => api.events.get(id),
    enabled: !!id,
  });
}

export function useCreateEvent(options?: UseMutationOptions<unknown, Error, EventConfigFormData>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.events.create,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

export function useUpdateEvent(options?: UseMutationOptions<unknown, Error, EventConfigFormData & { __originalId?: string }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: (variables) => api.events.update(variables, variables.__originalId),
    onSuccess: async (data, variables, ...rest) => {
      if (variables.__originalId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.__originalId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useUpdateEventWithIdChange(options?: UseMutationOptions<unknown, Error, { oldId: string; config: EventConfigFormData }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: ({ oldId, config }) => api.events.updateWithIdChange(oldId, config),
    onSuccess: async (data, variables, ...rest) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.oldId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.config.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useDeleteEvent(options?: UseMutationOptions<unknown, Error, string>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.events.delete,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Sinks
export function useSinks() {
  return useQuery({
    queryKey: queryKeys.sinksList(),
    queryFn: async () => {
      try {
        return await api.sinks.list();
      } catch (error) {
        console.error('[useSinks] Error:', error);
        toast.error(`Failed to load sinks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

export function useSink(id: string) {
  return useQuery({
    queryKey: queryKeys.sink(id),
    queryFn: () => api.sinks.get(id),
    enabled: !!id,
  });
}

export function useCreateSink(options?: UseMutationOptions<unknown, Error, SinkConfigFormData>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.sinks.create,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sinksList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

export function useUpdateSink(options?: UseMutationOptions<unknown, Error, SinkConfigFormData & { __originalId?: string }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: (variables) => api.sinks.update(variables, variables.__originalId),
    onSuccess: async (data, variables, ...rest) => {
      if (variables.__originalId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.sink(variables.__originalId) });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.sink(variables.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sinksList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useUpdateSinkWithIdChange(options?: UseMutationOptions<unknown, Error, { oldId: string; config: SinkConfigFormData }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: ({ oldId, config }) => api.sinks.updateWithIdChange(oldId, config),
    onSuccess: async (data, variables, ...rest) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sink(variables.oldId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sink(variables.config.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sinksList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(data, variables, ...rest);
      }
    },
  });
}

export function useDeleteSink(options?: UseMutationOptions<unknown, Error, string>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.sinks.delete,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sinksList() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dataFlow() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Config reload
export function useReloadConfig(options?: UseMutationOptions<ReloadResponse, Error, void>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: api.config.reload,
    onSuccess: async (...args) => {
      // Invalidate all config queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.all });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Config export
export function useExportConfig(options?: UseMutationOptions<Blob, Error, void>) {
  return useMutation({
    ...options,
    mutationFn: api.config.export,
  });
}

// Config upload/import
export function useImportConfig(options?: UseMutationOptions<any, Error, { file: File; mode: 'replace' | 'merge' }>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  
  return useMutation({
    ...options,
    mutationFn: ({ file, mode }) => api.config.upload(file, mode),
    onSuccess: async (...args) => {
      // Invalidate all config queries after import
      await queryClient.invalidateQueries({ queryKey: queryKeys.all });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}

// Root (main) config
export function useMainConfig() {
  return useQuery({
    queryKey: queryKeys.mainConfig(),
    queryFn: async () => {
      try {
        return await api.mainConfig.get();
      } catch (error) {
        console.error('[useMainConfig] Error:', error);
        toast.error(`Failed to load main config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
  });
}

export function useUpdateMainConfig(options?: UseMutationOptions<unknown, Error, any>) {
  const queryClient = useQueryClient();
  const originalOnSuccess = options?.onSuccess;
  return useMutation({
    ...options,
    mutationFn: api.mainConfig.updateJson,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mainConfig() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.status() });
      if (originalOnSuccess) {
        await originalOnSuccess(...args);
      }
    },
  });
}
