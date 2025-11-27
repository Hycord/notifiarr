import type {
  HealthResponse,
  StatusResponse,
  ConfigFilesResponse,
  ReloadResponse,
  UploadResponse,
  ConfigFilePutResponse,
  ConfigFileDeleteResponse,
  DataFlowResponse,
} from './types';

// Use Next.js API routes as proxy to avoid CORS issues
const API_BASE = '/api';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new APIError(
      errorText || `API request failed: ${res.statusText}`,
      res.status,
      res.statusText
    );
  }

  // Handle empty responses
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  try {
    // Clone response so we can read it twice if needed
    const clonedRes = res.clone();
    return await res.json();
  } catch (error) {
    // Try to get the raw text for debugging
    let responseText = 'Unable to read response';
    try {
      const clonedRes = res.clone();
      responseText = await clonedRes.text();
    } catch (e) {
      // Response already consumed
    }
    
    console.error('[API] JSON parse error:', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      responseText: responseText.substring(0, 200),
      contentType: res.headers.get('content-type'),
    });
    
    throw new APIError(
      `Failed to parse JSON response from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
      res.status,
      'JSON Parse Error'
    );
  }
}

export const api = {
  // Health & Status
  health: () => fetchApi<HealthResponse>('/health'),
  
  status: async () => {
    // The backend may return either a nested { status: {...} } object
    // or a root-level status payload. Normalize to generated types shape.
    const res = await fetchApi<any>('/status');
    if (res && typeof res === 'object' && 'status' in res) {
      return res as StatusResponse;
    }
    // Root-level payload -> wrap under { status: ... }
    const normalized: StatusResponse = {
      status: {
        running: res.running,
        reloading: res.reloading,
        clients: res.clients,
        servers: res.servers,
        sinks: res.sinks,
        events: res.events,
        watchers: res.watchers,
        configPath: res.configPath,
        configDirectory: res.configDirectory,
      },
      // Some backends also include top-level configDirectory; preserve it
      configDirectory: res.configDirectory,
    };
    return normalized;
  },

  dataFlow: () => fetchApi<DataFlowResponse>('/data-flow'),

  // Configuration Management
  config: {
    reload: () => fetchApi<ReloadResponse>('/config/reload', { method: 'POST' }),
    
    export: async () => {
      // Backend returns JSON (optionally gzipped as .json.gz)
      const res = await fetch(`${API_BASE}/config/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new APIError(
          errorText || `Export failed: ${res.statusText}`,
          res.status,
          res.statusText
        );
      }
      
      // Return as blob for download (can be JSON or gzipped JSON)
      return res.blob();
    },
    
    upload: async (file: File | Blob, mode: 'replace' | 'merge' = 'replace') => {
      // Backend expects raw body (not FormData) for .json.gz or .json files
      const headers: HeadersInit = {
        'Content-Type': file.type || 'application/json',
        'Accept': 'application/json',
      };
      // If uploading gzip, hint content-encoding for backend
      const isGzip = (file.type || '').includes('gzip');
      if (isGzip) {
        (headers as Record<string, string>)['Content-Encoding'] = 'gzip';
      }
      if (AUTH_TOKEN) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${AUTH_TOKEN}`;
      }
      const res = await fetch(`${API_BASE}/config/upload?mode=${mode}`, {
        method: 'POST',
        headers,
        body: file,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new APIError(
          errorText || `Upload failed: ${res.statusText}`,
          res.status,
          res.statusText
        );
      }
      
      return res.json();
    },
  },

  // File Operations
  files: {
    list: () => fetchApi<ConfigFilesResponse>('/config/files'),
    
    get: (category: string, filename: string) => {
      // Remove extension from filename for the API call
      const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
      // Backend returns JSON objects directly, not stringified
      return fetchApi<any>(`/config/file/${category}/${filenameWithoutExt}`)
        .then((res) => {
          // If it's already an object, return it as-is
          // If it's a string, return the string
          return res;
        });
    },
    
    update: (category: string, filename: string, content: string) => {
      // Remove extension from filename for the API call
      const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
      return fetchApi<ConfigFilePutResponse>(`/config/file/${category}/${filenameWithoutExt}`, {
        method: 'PUT',
        body: content,
        headers: { 'Content-Type': 'text/plain' },
      });
    },

    updateJson: (category: string, filename: string, data: unknown) => {
      const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
      return fetchApi<ConfigFilePutResponse>(`/config/file/${category}/${filenameWithoutExt}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    
    delete: (category: string, filename: string) => {
      // Remove extension from filename for the API call
      const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
      return fetchApi<ConfigFileDeleteResponse>(`/config/file/${category}/${filenameWithoutExt}`, {
        method: 'DELETE',
      });
    },
  },

  // Typed config helpers
  clients: {
    list: async () => {
      const files = await api.files.list();
      return Promise.all(
        (files.clients ?? []).map(async (filename) => {
          const content = await api.files.get('clients', filename);
          return content;
        })
      );
    },
    
    get: async (id: string) => {
      // Find the actual filename from the list
      const files = await api.files.list();
      const filename = (files.clients ?? []).find(f => f.replace(/\.[^.]+$/, '') === id);
      if (!filename) throw new Error(`Client ${id} not found`);
      const content = await api.files.get('clients', filename);
      return content;
    },
    
    create: (config: any) =>
      api.files.updateJson('clients', config.id, config),
    
    update: async (config: any, originalId?: string) => {
      // If originalId provided and different from new ID, delete the old file first
      if (originalId && originalId !== config.id) {
        try {
          await api.files.delete('clients', originalId);
        } catch (e) {
          // Continue if delete fails (file might not exist)
        }
      }
      return api.files.updateJson('clients', config.id, config);
    },
    
    updateWithIdChange: async (oldId: string, config: any) => {
      // Delete old file and create new one
      await api.files.delete('clients', oldId);
      return api.files.updateJson('clients', config.id, config);
    },
    
    delete: (id: string) => api.files.delete('clients', id),
  },

  servers: {
    list: async () => {
      const files = await api.files.list();
      return Promise.all(
        (files.servers ?? []).map(async (filename) => {
          const content = await api.files.get('servers', filename);
          return content;
        })
      );
    },
    
    get: async (id: string) => {
      // Find the actual filename from the list
      const files = await api.files.list();
      const filename = (files.servers ?? []).find(f => f.replace(/\.[^.]+$/, '') === id);
      if (!filename) throw new Error(`Server ${id} not found`);
      const content = await api.files.get('servers', filename);
      return content;
    },
    
    create: (config: any) =>
      api.files.updateJson('servers', config.id, config),
    
    update: async (config: any, originalId?: string) => {
      // If originalId provided and different from new ID, delete the old file first
      if (originalId && originalId !== config.id) {
        try {
          await api.files.delete('servers', originalId);
        } catch (e) {
          // Continue if delete fails (file might not exist)
        }
      }
      return api.files.updateJson('servers', config.id, config);
    },
    
    updateWithIdChange: async (oldId: string, config: any) => {
      // Delete old file and create new one
      await api.files.delete('servers', oldId);
      return api.files.updateJson('servers', config.id, config);
    },
    
    delete: (id: string) => api.files.delete('servers', id),
  },

  events: {
    list: async () => {
      const files = await api.files.list();
      return Promise.all(
        (files.events ?? []).map(async (filename) => {
          const content = await api.files.get('events', filename);
          return content;
        })
      );
    },
    
    get: async (id: string) => {
      // Find the actual filename from the list
      const files = await api.files.list();
      const filename = (files.events ?? []).find(f => f.replace(/\.[^.]+$/, '') === id);
      if (!filename) throw new Error(`Event ${id} not found`);
      const content = await api.files.get('events', filename);
      return content;
    },
    
    create: (config: any) =>
      api.files.updateJson('events', config.id, config),
    
    update: async (config: any, originalId?: string) => {
      // If originalId provided and different from new ID, delete the old file first
      if (originalId && originalId !== config.id) {
        try {
          await api.files.delete('events', originalId);
        } catch (e) {
          // Continue if delete fails (file might not exist)
        }
      }
      return api.files.updateJson('events', config.id, config);
    },
    
    updateWithIdChange: async (oldId: string, config: any) => {
      // Delete old file and create new one
      await api.files.delete('events', oldId);
      return api.files.updateJson('events', config.id, config);
    },
    
    delete: (id: string) => api.files.delete('events', id),
  },

  sinks: {
    list: async () => {
      const files = await api.files.list();
      return Promise.all(
        (files.sinks ?? []).map(async (filename) => {
          const content = await api.files.get('sinks', filename);
          return content;
        })
      );
    },
    
    get: async (id: string) => {
      // Find the actual filename from the list
      const files = await api.files.list();
      const filename = (files.sinks ?? []).find(f => f.replace(/\.[^.]+$/, '') === id);
      if (!filename) throw new Error(`Sink ${id} not found`);
      const content = await api.files.get('sinks', filename);
      return content;
    },
    
    create: (config: any) =>
      api.files.updateJson('sinks', config.id, config),
    
    update: async (config: any, originalId?: string) => {
      // If originalId provided and different from new ID, delete the old file first
      if (originalId && originalId !== config.id) {
        try {
          await api.files.delete('sinks', originalId);
        } catch (e) {
          // Continue if delete fails (file might not exist)
        }
      }
      return api.files.updateJson('sinks', config.id, config);
    },
    
    updateWithIdChange: async (oldId: string, config: any) => {
      // Delete old file and create new one
      await api.files.delete('sinks', oldId);
      return api.files.updateJson('sinks', config.id, config);
    },
    
    delete: (id: string) => api.files.delete('sinks', id),
  },

  // Root config API
  mainConfig: {
    get: async () => {
      return fetchApi<any>('/config');
    },
    update: (content: string) => {
      return fetchApi<{ updated: boolean; uploadFormat: string; storedFormat: string; path: string }>('/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
      });
    },
    updateJson: (data: unknown) => {
      return fetchApi<{ updated: boolean; uploadFormat: string; storedFormat: string; path: string }>('/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  },
};

export { APIError };
