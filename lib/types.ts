/**
 * API Type Reference
 * 
 * TypeScript type definitions for all API responses and configuration types.
 * These types match the exact structure returned by the Config API endpoints.
 * 
 * This file includes:
 * 
 * **Health & Status Endpoints:**
 * - HealthResponse, StatusResponse
 * - ClientStatus, ServerStatus, SinkStatus, EventStatus
 * 
 * **Config Management:**
 * - ReloadResponse, ReloadSummary
 * - ConfigFilesResponse, UploadResponse
 * 
 * **File Operations:**
 * - ConfigFileGetResponse, ConfigFilePutResponse, ConfigFileDeleteResponse
 * 
 * **Configuration Types:**
 * - ClientConfig, ServerConfig, EventConfig, SinkConfig, IRCNotifyConfig
 * - ParserRule, FileTypeConfig, FilterConfig, FilterGroup
 * - ConfigExport (bundle format)
 * 
 * **Error Handling:**
 * - ErrorResponse
 */

// ============================================================================
// Health & Status Endpoints
// ============================================================================

/**
 * Response from GET /api/health
 */
export interface HealthResponse {
  ok: boolean;
  time: string; // ISO 8601 timestamp
}

/**
 * Client information in status response
 */
export interface ClientStatus {
  id: string;
  enabled: boolean;
  type: string;
}

/**
 * Server information in status response
 */
export interface ServerStatus {
  id: string;
  enabled: boolean;
  displayName: string;
}

/**
 * Sink information in status response
 */
export interface SinkStatus {
  id: string;
  enabled: boolean;
  type: string;
}

/**
 * Event information in status response
 */
export interface EventStatus {
  id: string;
  enabled: boolean;
  clientId: string;
  serverId: string;
}

/**
 * Response from GET /api/status
 */
export interface StatusResponse {
  status: {
    running: boolean;
    reloading: boolean;
    clients: {
      total: number;
      enabled: number;
      list: ClientStatus[];
    };
    servers: {
      total: number;
      enabled: number;
      list: ServerStatus[];
    };
    sinks: {
      total: number;
      enabled: number;
      list: SinkStatus[];
    };
    events: {
      total: number;
      enabled: number;
      list: EventStatus[];
    };
    watchers: number;
    configPath?: string;
    configDirectory: string;
  };
  configDirectory: string;
}

// ============================================================================
// Config Management Endpoints
// ============================================================================

/**
 * Response from POST /api/config/reload
 */
export interface ReloadResponse {
  reloaded: boolean;
  summary: ReloadSummary;
}

/**
 * Summary of what was reloaded
 */
export interface ReloadSummary {
  clients: number;
  servers: number;
  events: number;
  sinks: number;
  watchers: number;
}

/**
 * Response from GET /api/config/files
 */
export interface ConfigFilesResponse {
  clients?: string[];
  servers?: string[];
  events?: string[];
  sinks?: string[];
  main?: string[];
}

/**
 * Response from POST /api/config/upload
 */
export interface UploadResponse {
  ok: boolean;
  mode: "replace" | "merge";
  summary: ReloadSummary;
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Response from GET /api/config/file/<category>/<name>
 * Body contains the file content as text (TypeScript or JSON based on format parameter)
 * 
 * Response headers:
 * - content-type: "application/json" or "text/plain; charset=utf-8"
 * - x-source-format: "typescript" or "json" (original file format on disk)
 * - x-response-format: "json" or "ts" (format returned to client)
 */
export type ConfigFileGetResponse = string;

/**
 * Response from PUT /api/config/file/<category>/<name>
 */
export interface ConfigFilePutResponse {
  updated: boolean;
  uploadFormat: "json" | "typescript";
  storedFormat: "typescript";
}

/**
 * Response from DELETE /api/config/file/<category>/<name>
 */
export interface ConfigFileDeleteResponse {
  deleted: boolean;
}

// ============================================================================
// Error Responses
// ============================================================================

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Parser rule for IRC log parsing
 */
export interface ParserRule {
  id: string;
  pattern: string;
  flags?: string;
  priority?: number;
  skip?: boolean;
  groups: {
    timestamp?: number;
    sender?: number;
    action?: number;
    content?: number;
    target?: number;
    mode?: number;
    oldNick?: number;
    newNick?: number;
    reason?: number;
    topic?: number;
  };
  eventType:
    | "message"
    | "join"
    | "part"
    | "quit"
    | "nick"
    | "kick"
    | "mode"
    | "topic"
    | "connect"
    | "disconnect";
}

/**
 * File type configuration for log files
 */
export interface FileTypeConfig {
  encoding: string;
  lineEnding?: string;
  timestampFormat?: string;
  timezone?: string;
}

/**
 * Filter configuration for message filtering
 */
export interface FilterConfig {
  field: string;
  operator:
    | "equals"
    | "notEquals"
    | "contains"
    | "notContains"
    | "matches"
    | "notMatches"
    | "exists"
    | "notExists"
    | "in"
    | "notIn";
  value?: any;
  pattern?: string;
  flags?: string;
  values?: any[];
}

/**
 * Filter group (AND/OR combination of filters)
 */
export interface FilterGroup {
  operator: "AND" | "OR";
  filters: Array<FilterConfig | FilterGroup>;
}

/**
 * Client configuration (returned in GET /api/config/file/clients/<id>)
 */
export interface ClientConfig {
  id: string;
  name: string;
  enabled: boolean;
  logDirectory: string;

  discovery: {
    patterns: {
      console?: string;
      channels?: string;
      queries?: string;
    };
    pathExtraction: {
      serverPattern?: string;
      serverGroup?: number;
      channelPattern?: string;
      channelGroup?: number;
      queryPattern?: string;
      queryGroup?: number;
      consolePattern?: string;
    };
  };

  serverDiscovery: {
    type: "static" | "filesystem" | "json" | "sqlite";
    servers?: Array<{ hostname: string; metadata?: Record<string, any> }>;
    searchPattern?: string;
    hostnamePattern?: string;
    hostnameGroup?: number;
    jsonPath?: string;
    hostnameField?: string;
    query?: string;
    hostnameColumn?: string;
  };

  fileType: FileTypeConfig;
  parserRules: ParserRule[];
  metadata?: Record<string, any>;
}

/**
 * Server configuration (returned in GET /api/config/file/servers/<id>)
 */
export interface ServerConfig {
  id: string;
  hostname: string;
  displayName: string;
  clientNickname: string;
  network?: string;
  port?: number;
  tls?: boolean;
  enabled: boolean;
  users?: {
    [nickname: string]: {
      realname?: string;
      modes?: string[];
      metadata?: Record<string, any>;
    };
  };
  metadata?: Record<string, any>;
}

/**
 * Event configuration (returned in GET /api/config/file/events/<id>)
 */
export interface EventConfig {
  id: string;
  name: string;
  enabled: boolean;
  baseEvent:
    | "message"
    | "join"
    | "part"
    | "quit"
    | "nick"
    | "kick"
    | "mode"
    | "topic"
    | "connect"
    | "disconnect"
    | "any";
  serverIds: string[];
  filters?: FilterGroup;
  sinkIds: string[];
  priority?: number;
  group?: string;
  metadata?: Record<string, any>;
}

/**
 * Sink configuration (returned in GET /api/config/file/sinks/<id>)
 */
export interface SinkConfig {
  id: string;
  type: "ntfy" | "webhook" | "console" | "file" | "custom";
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  // Flexible template: arbitrary key/value mapping (any JSON-serializable values)
  template?: Record<string, any>;
  rateLimit?: {
    maxPerMinute?: number;
    maxPerHour?: number;
  };
  allowedMetadata?: string[];
  metadata?: Record<string, any>;
  payloadTransforms?: PayloadTransform[];
}

export interface PayloadTransform {
  name: string;
  contentType?: string;
  method?: string;
  headers?: Record<string, string | { template: string }>;
  bodyFormat: "json" | "text" | "form" | "custom";
  jsonTemplate?: Record<string, any>;
  textTemplate?: string;
  formTemplate?: Record<string, string>;
  priority?: number;
  condition?: FilterConfig; // Optional single filter condition
}

/**
 * Root configuration (returned in GET /api/config/file/main/config)
 */
export interface IRCNotifyConfig {
  global: {
    defaultLogDirectory?: string;
    pollInterval?: number;
    debug?: boolean;
    configDirectory?: string;
    rescanLogsOnStartup?: boolean;
  };

  api?: {
    enabled?: boolean;
    port?: number;
    host?: string;
    authToken?: string;
    enableFileOps?: boolean;
  };

  clients?: string[];
  servers?: string[];
  events?: string[];
  sinks?: string[];
}

// ============================================================================
// Config Export Format
// ============================================================================

/**
 * Structure of exported config bundles (from GET /api/config/export)
 */
export interface ConfigExport {
  version: string;
  timestamp: string;
  metadata: {
    sourceConfigPath: string;
    sourceConfigDir: string;
    unpackConfigDir: string;
    unpackConfigPath: string;
  };
  config: IRCNotifyConfig;
  clients: ClientConfig[];
  servers: ServerConfig[];
  events: EventConfig[];
  sinks: SinkConfig[];
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Fetching status
 * 
 * ```typescript
 * const response = await fetch('http://localhost:3000/api/status', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * const data: StatusResponse = await response.json();
 * console.log(`Running: ${data.status.running}`);
 * console.log(`Clients: ${data.status.clients.enabled}/${data.status.clients.total}`);
 * ```
 */

/**
 * Example: Reading a config file as JSON (default)
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/events/phrase-alert',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const config: EventConfig = await response.json();
 * console.log(`Event: ${config.name}, Enabled: ${config.enabled}`);
 * ```
 */

/**
 * Example: Reading a server config
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/servers/libera',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const server: ServerConfig = await response.json();
 * console.log(`Server: ${server.displayName} (${server.hostname})`);
 * ```
 */

/**
 * Example: Reading a client config
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/clients/textual',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const client: ClientConfig = await response.json();
 * console.log(`Client: ${client.name}, Type: ${client.type}`);
 * ```
 */

/**
 * Example: Reading a sink config
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/sinks/ntfy',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const sink: SinkConfig = await response.json();
 * console.log(`Sink: ${sink.name}, Type: ${sink.type}`);
 * ```
 */

/**
 * Example: Reading the main config
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/main/config',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const mainConfig: IRCNotifyConfig = await response.json();
 * console.log(`Debug: ${mainConfig.global.debug}`);
 * console.log(`Config Dir: ${mainConfig.global.configDirectory}`);
 * ```
 */

/**
 * Example: Reading a config file as TypeScript
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/events/phrase-alert?format=ts',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const tsContent = await response.text();
 * // Returns: export default defineEvent({ ... });
 * ```
 */

/**
 * Example: Updating an event config (JSON upload, stored as TypeScript)
 * 
 * ```typescript
 * const config: EventConfig = {
 *   id: 'my-event',
 *   name: 'My Custom Event',
 *   enabled: true,
 *   baseEvent: 'message',
 *   serverIds: ['libera'],
 *   sinkIds: ['console'],
 *   filters: {
 *     operator: 'AND',
 *     filters: [
 *       { field: 'message.content', operator: 'contains', value: 'test' }
 *     ]
 *   }
 * };
 * 
 * const response = await fetch(
 *   'http://localhost:3000/api/config/file/events/my-event',
 *   {
 *     method: 'PUT',
 *     headers: { 
 *       'Authorization': `Bearer ${token}`,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify(config)
 *   }
 * );
 * const result: ConfigFilePutResponse = await response.json();
 * // result.uploadFormat === "json"
 * // result.storedFormat === "typescript"
 * ```
 */

/**
 * Example: Exporting all configs
 * 
 * ```typescript
 * const response = await fetch(
 *   'http://localhost:3000/api/config/export',
 *   { headers: { 'Authorization': `Bearer ${token}` } }
 * );
 * const bundle: ConfigExport = await response.json();
 * 
 * console.log(`Version: ${bundle.version}`);
 * console.log(`Timestamp: ${bundle.timestamp}`);
 * console.log(`Clients: ${bundle.clients.length}`);
 * console.log(`Servers: ${bundle.servers.length}`);
 * console.log(`Events: ${bundle.events.length}`);
 * console.log(`Sinks: ${bundle.sinks.length}`);
 * 
 * // Access individual configs
 * bundle.clients.forEach((client: ClientConfig) => {
 *   console.log(`  - ${client.name} (${client.type})`);
 * });
 * ```
 */

/**
 * Example: Error handling
 * 
 * ```typescript
 * const response = await fetch('http://localhost:3000/api/config/file/events/nonexistent', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * 
 * if (!response.ok) {
 *   const error: ErrorResponse = await response.json();
 *   console.error(`Error: ${error.error}`);
 * }
 * ```
 */

// ============================================================================
// Data Flow Endpoint
// ============================================================================

/**
 * Aggregate statistics about the current configuration
 */
export interface DataFlowStats {
  totalClients: number;
  enabledClients: number;
  totalServers: number;
  enabledServers: number;
  totalEvents: number;
  enabledEvents: number;
  totalSinks: number;
  enabledSinks: number;
  totalParserRules: number;
  totalRoutingPaths: number;
  enabledRoutingPaths: number;
  eventsWithFilters: number;
  eventsWithWildcardServers: number;
  sinksWithRateLimit: number;
  sinksWithTemplates: number;
}

/**
 * Parser rule with analyzed metadata
 */
export interface DataFlowParserRule {
  name: string;
  pattern: string;
  flags?: string;
  messageType?: string;
  priority: number;
  skip: boolean;
  captureFields: string[];
  hasTimestamp: boolean;
  hasNickname: boolean;
  hasContent: boolean;
  hasTarget: boolean;
}

/**
 * Client adapter configuration with analyzed metadata
 */
export interface DataFlowClient {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  logDirectory: string;
  discoveryPatterns: {
    console?: string;
    channels?: string;
    queries?: string;
  };
  pathExtraction: {
    serverPattern?: string;
    serverGroup?: number;
    channelPattern?: string;
    channelGroup?: number;
    queryPattern?: string;
    queryGroup?: number;
  };
  serverDiscoveryType: string;
  fileType: string;
  pollInterval?: number;
  parserRules: DataFlowParserRule[];
  totalParserRules: number;
  skipRules: number;
  metadata?: Record<string, any>;
}

/**
 * Server configuration with analyzed user data and client associations
 */
export interface DataFlowServer {
  id: string;
  hostname: string;
  displayName: string;
  clientNickname: string;
  network?: string;
  port?: number;
  enabled: boolean;
  clientIds: string[];
  clientNames: string[];
  usersCount: number;
  users?: Array<{
    nickname: string;
    realname?: string;
    modes?: string[];
    hasMetadata: boolean;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Sink configuration with template analysis
 */
export interface DataFlowSink {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  hasRateLimit: boolean;
  rateLimit?: {
    maxPerMinute?: number;
    maxPerHour?: number;
  };
  hasTemplate: boolean;
  templateFormat?: string;
  templateFields?: string[];
  allowedMetadata?: string[];
  hasPayloadTransforms: boolean;
  payloadTransformsCount: number;
  config: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Analyzed filter with template detection
 */
export interface DataFlowFilter {
  type: 'simple' | 'group';
  // For simple filters
  field?: string;
  operator?: string;
  value?: any;
  pattern?: string;
  flags?: string;
  // For group filters
  groupOperator?: 'AND' | 'OR';
  filters?: DataFlowFilter[];
  // Metadata
  usesTemplates: boolean;
  targetedFields: string[];
}

/**
 * Event configuration with filter analysis
 */
export interface DataFlowEvent {
  id: string;
  name: string;
  enabled: boolean;
  baseEvent: string;
  priority: number;
  group?: string;
  serverIds: string[];
  serverIdType: 'wildcard' | 'specific' | 'empty';
  appliesToAllServers: boolean;
  serverCount: number;
  hasFilters: boolean;
  filterComplexity?: number;
  filters?: DataFlowFilter;
  sinkIds: string[];
  sinkCount: number;
  hasMetadata: boolean;
  metadataKeys?: string[];
  usesTemplatesInMetadata: boolean;
  metadata?: Record<string, any>;
}

/**
 * A complete routing path from client through event to sinks
 */
export interface DataFlowRoutingPath {
  clientId: string;
  clientName: string;
  clientEnabled: boolean;
  serverId: string;
  serverName: string;
  serverEnabled: boolean;
  eventId: string;
  eventName: string;
  eventEnabled: boolean;
  eventPriority: number;
  baseEvent: string;
  hasFilters: boolean;
  filterSummary?: string;
  sinkIds: string[];
  sinkNames: string[];
  sinkStatuses: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
  enabled: boolean; // Whether this path is active (all components enabled)
}

/**
 * Response from GET /api/data-flow
 */
export interface DataFlowResponse {
  timestamp: string;
  configDirectory: string;
  running: boolean;
  stats: DataFlowStats;
  clients: DataFlowClient[];
  servers: DataFlowServer[];
  sinks: DataFlowSink[];
  events: DataFlowEvent[];
  routingPaths: DataFlowRoutingPath[];
  messageTypeMapping: Record<string, string[]>;
}
