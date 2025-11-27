import { z } from 'zod';

// Basic ID validation
const idSchema = z
  .string()
  .min(1, 'ID is required')
  .regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with dashes');

// Filter schemas
export const filterConfigSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum([
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'matches',
    'notMatches',
    'exists',
    'notExists',
    'in',
    'notIn',
  ]),
  value: z.any().optional(),
  pattern: z.string().optional(),
  flags: z.string().optional(),
});

export type FilterConfigFormData = z.infer<typeof filterConfigSchema>;

export const filterGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    operator: z.enum(['AND', 'OR']),
    filters: z.array(z.union([filterConfigSchema, filterGroupSchema])),
  })
);

export type FilterGroupFormData = z.infer<typeof filterGroupSchema>;

// Parser Rule schema
// Parser rule schema (extended to match backend reference while supporting legacy fields)
export const parserRuleSchema = z.object({
  // Legacy name field retained; backend uses id. Accept either.
  id: idSchema.optional(),
  name: z.string().optional(),
  pattern: z.string().min(1, 'Pattern is required'),
  flags: z.string().optional(),
  priority: z.number().optional(),
  skip: z.boolean().optional(),
  // Backend eventType enumeration
  eventType: z
    .enum([
      'message',
      'join',
      'part',
      'quit',
      'nick',
      'kick',
      'mode',
      'topic',
      'connect',
      'disconnect',
    ])
    .optional(),
  // Legacy fields for backward compatibility
  messageType: z.string().optional(),
  captures: z
    .object({
      timestamp: z.string().optional(),
      nickname: z.string().optional(),
      username: z.string().optional(),
      hostname: z.string().optional(),
      content: z.string().optional(),
      target: z.string().optional(),
    })
    .catchall(z.string().optional())
    .optional(),
  // Backend groups mapping (numeric indices)
  groups: z
    .object({
      timestamp: z.number().optional(),
      sender: z.number().optional(),
      action: z.number().optional(),
      content: z.number().optional(),
      target: z.number().optional(),
      mode: z.number().optional(),
      oldNick: z.number().optional(),
      newNick: z.number().optional(),
      reason: z.number().optional(),
      topic: z.number().optional(),
    })
    .optional(),
});

// File Type schema - includes type field from actual configs even though backend type doesn't show it
export const fileTypeConfigSchema = z.object({
  type: z.enum(['text', 'sqlite', 'json']).optional(),
  encoding: z.string(),
  lineEnding: z.string().optional(),
  timestampFormat: z.string().optional(),
  timezone: z.string().optional(),
  query: z.string().optional(),
  pollInterval: z.number().optional(),
  jsonPath: z.string().optional(),
});

// Client Config schema
export const clientConfigSchema = z.object({
  id: idSchema,
  name: z.string().min(1, 'Name is required'),
  enabled: z.boolean(),
  logDirectory: z.string().min(1, 'Log directory is required'),
  discovery: z.object({
    patterns: z.object({
      console: z.string().optional(),
      channels: z.string().optional(),
      queries: z.string().optional(),
    }),
    pathExtraction: z.object({
      serverPattern: z.string().optional(),
      serverGroup: z.number().optional(),
      channelPattern: z.string().optional(),
      channelGroup: z.number().optional(),
      queryPattern: z.string().optional(),
      queryGroup: z.number().optional(),
      consolePattern: z.string().optional(),
    }),
  }),
  serverDiscovery: z.object({
    type: z.enum(['static', 'filesystem', 'json', 'sqlite']),
    servers: z
      .array(
        z.object({
          hostname: z.string(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
      )
      .optional(),
    searchPattern: z.string().optional(),
    hostnamePattern: z.string().optional(),
    hostnameGroup: z.number().optional(),
    jsonPath: z.string().optional(),
    hostnameField: z.string().optional(),
    query: z.string().optional(),
    hostnameColumn: z.string().optional(),
  }).passthrough(),
  fileType: fileTypeConfigSchema,
  parserRules: z.array(parserRuleSchema),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ClientConfigFormData = z.infer<typeof clientConfigSchema>;

// Server Config schema
export const serverConfigSchema = z.object({
  id: idSchema,
  hostname: z.string().min(1, 'Hostname is required'),
  displayName: z.string().min(1, 'Display name is required'),
  clientNickname: z.string().min(1, 'Client nickname is required'),
  network: z.string().optional(),
  port: z.number().optional(),
  tls: z.boolean().optional(),
  enabled: z.boolean(),
  users: z
    .record(
      z.string(),
      z.object({
        realname: z.string().optional(),
        modes: z.array(z.string()).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ServerConfigFormData = z.infer<typeof serverConfigSchema>;

// Event Config schema
export const eventConfigSchema = z.object({
  id: idSchema,
  name: z.string().min(1, 'Name is required'),
  enabled: z.boolean(),
  baseEvent: z.enum([
    'message',
    'join',
    'part',
    'quit',
    'nick',
    'kick',
    'mode',
    'topic',
    'connect',
    'disconnect',
    'any',
  ]),
  serverIds: z.array(z.string()),
  filters: filterGroupSchema.optional(),
  sinkIds: z.array(z.string()),
  priority: z.number().optional(),
  group: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type EventConfigFormData = z.infer<typeof eventConfigSchema>;

// Sink Config schema
export const sinkConfigSchema = z.object({
  id: idSchema,
  type: z.enum(['ntfy', 'webhook', 'console', 'file', 'custom']),
  name: z.string().min(1, 'Name is required'),
  enabled: z.boolean(),
  config: z.record(z.string(), z.any()),
  // Flexible template: arbitrary keys with any JSON-serializable values
  template: z.record(z.string(), z.any()).optional(),
  rateLimit: z
    .object({
      maxPerMinute: z.number().optional(),
      maxPerHour: z.number().optional(),
    })
    .optional(),
  allowedMetadata: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  payloadTransforms: z
    .array(
      z.object({
        name: z.string().min(1, 'Transform name is required'),
        contentType: z.string().optional(),
        method: z.string().optional(),
        headers: z
          .record(
            z.string(),
            z.union([
              z.string(),
              z.number(),
              z.object({ template: z.string().min(1, 'Template is required') }),
            ])
          )
          .optional(),
        bodyFormat: z.enum(['json', 'text', 'form', 'custom']),
        jsonTemplate: z.record(z.string(), z.any()).optional(),
        textTemplate: z.string().optional(),
        formTemplate: z.record(z.string(), z.string()).optional(),
        priority: z.number().optional(),
        condition: filterConfigSchema.optional(),
      })
    )
    .optional(),
});

export type SinkConfigFormData = z.infer<typeof sinkConfigSchema>;

// Root (main) configuration schema
export const ircNotifyConfigSchema = z.object({
  global: z
    .object({
      defaultLogDirectory: z.string().optional(),
      pollInterval: z.number().optional(),
      debug: z.boolean().optional(),
      configDirectory: z.string().optional(),
      rescanLogsOnStartup: z.boolean().optional(),
    })
    .default({}),
  api: z
    .object({
      enabled: z.boolean().optional(),
      port: z.number().optional(),
      host: z.string().optional(),
      authToken: z.string().optional(),
      enableFileOps: z.boolean().optional(),
    })
    .optional(),
});

export type IRCNotifyConfigFormData = z.infer<typeof ircNotifyConfigSchema>;

// Validation helpers
export function validateEventReferences(
  event: EventConfigFormData,
  serverIds: string[],
  sinkIds: string[]
): string[] {
  const errors: string[] = [];

  // Allow empty arrays (orphaning is allowed)
  // Validate server references (allow "*" wildcard)
  for (const serverId of event.serverIds || []) {
    if (serverId !== '*' && !serverIds.includes(serverId)) {
      errors.push(`Server ID "${serverId}" does not exist`);
    }
  }

  // Validate sink references (empty is allowed)
  for (const sinkId of event.sinkIds || []) {
    if (!sinkIds.includes(sinkId)) {
      errors.push(`Sink ID "${sinkId}" does not exist`);
    }
  }

  return errors;
}

export function validateSinkMetadata(
  event: EventConfigFormData,
  sinks: Array<{ id: string; allowedMetadata?: string[] }>
): string[] {
  const errors: string[] = [];

  if (!event.metadata) return errors;

  for (const sinkId of event.sinkIds) {
    const sink = sinks.find((s) => s.id === sinkId);
    if (!sink) continue;

    // Check if event has sink-specific metadata
    const sinkMetadata = event.metadata[sinkId];
    if (!sinkMetadata || typeof sinkMetadata !== 'object') continue;

    // Validate metadata keys
    const metadataKeys = Object.keys(sinkMetadata);
    const allowedKeys = sink.allowedMetadata || [];

    for (const key of metadataKeys) {
      if (!allowedKeys.includes(key)) {
        errors.push(
          `Metadata key "${key}" for sink "${sinkId}" is not in allowedMetadata`
        );
      }
    }
  }

  return errors;
}

// Helper to create slug from name
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
