'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileCode, 
  Braces, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Code2,
  Sparkles,
  Database,
  Filter,
  Send,
  Layers
} from 'lucide-react';

export default function TemplatingPage() {
  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Template System</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Learn how to use dynamic templates throughout your IRC notification configuration.
          </p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Braces className="h-5 w-5 text-primary" />
              <CardTitle>Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The template engine provides dynamic variable substitution using <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{'{{field.path}}'}</code> syntax. 
              Templates can be used in sink configurations, event metadata, filters, and more.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg min-w-0 w-full">
                <Code2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 w-full">
                  <div className="font-medium text-sm leading-tight">Simple Syntax</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug" style={{ wordBreak: 'break-word' }}>
                    Use <code className="px-1 py-0.5 bg-muted rounded">{'{{variable}}'}</code> for easy access
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg min-w-0 w-full">
                <Layers className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 w-full">
                  <div className="font-medium text-sm leading-tight">Nested Fields</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug" style={{ wordBreak: 'break-word' }}>
                    Access deep properties with dot notation
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg min-w-0 w-full">
                <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 w-full">
                  <div className="font-medium text-sm leading-tight">Deep Processing</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug" style={{ wordBreak: 'break-word' }}>
                    Recursive resolution in complex objects
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syntax Guide (moved below Reference to match modal) */}
        <Card>
          <CardHeader>
            <CardTitle>Template Syntax</CardTitle>
            <CardDescription>
              How to reference context variables in your templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="nested">Nested</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{sender}}'}</div>
                    <div className="text-xs text-muted-foreground">Access entire sender object</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{message}}'}</div>
                    <div className="text-xs text-muted-foreground">Access entire message object</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{timestamp}}'}</div>
                    <div className="text-xs text-muted-foreground">Access timestamp Date object</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{server}}'}</div>
                    <div className="text-xs text-muted-foreground">Access entire server object</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nested" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{sender.nickname}}'}</div>
                    <div className="text-xs text-muted-foreground">Sender's IRC nickname</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{server.displayName}}'}</div>
                    <div className="text-xs text-muted-foreground">Server display name</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{message.content}}'}</div>
                    <div className="text-xs text-muted-foreground">Message text content</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{target.name}}'}</div>
                    <div className="text-xs text-muted-foreground">Channel or user target</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-mono text-sm">{'{{metadata.customField}}'}</div>
                    <div className="text-xs text-muted-foreground">Custom metadata values</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg space-y-2 overflow-x-auto">
                    <div className="font-mono text-sm text-green-500 whitespace-nowrap">
                      {'[{{server.displayName}}] {{sender.nickname}}'}
                    </div>
                    <div className="text-xs text-muted-foreground">→ [Libera] alice</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2 overflow-x-auto">
                    <div className="font-mono text-sm text-green-500 whitespace-nowrap">
                      {'Message from {{sender.nickname}} in {{target.name}}'}
                    </div>
                    <div className="text-xs text-muted-foreground">→ Message from alice in #general</div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2 overflow-x-auto">
                    <div className="font-mono text-sm text-green-500 whitespace-nowrap">
                      {'{{sender.nickname}}@{{server.network}}'}
                    </div>
                    <div className="text-xs text-muted-foreground">→ alice@libera</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* Context Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Available Context Fields</CardTitle>
            <CardDescription>
              Complete reference of all fields accessible in templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reference">Full Reference</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Quick reference of the most commonly used template fields. Switch to Full Reference for complete details.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-green-500">Message</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{message.content}}'}</code></div>
                      <div><code>{'{{message.type}}'}</code></div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-purple-500">Sender</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{sender.nickname}}'}</code></div>
                      <div><code>{'{{sender.username}}'}</code></div>
                      <div><code>{'{{sender.hostname}}'}</code></div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-yellow-500">Target</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{target.name}}'}</code></div>
                      <div><code>{'{{target.type}}'}</code></div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-red-500">Server</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{server.id}}'}</code></div>
                      <div><code>{'{{server.displayName}}'}</code></div>
                      <div><code>{'{{server.clientNickname}}'}</code></div>
                      <div><code>{'{{server.network}}'}</code></div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-orange-500">Client</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{client.id}}'}</code></div>
                      <div><code>{'{{client.type}}'}</code></div>
                      <div><code>{'{{client.name}}'}</code></div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="font-semibold text-sm text-cyan-500">Other</div>
                    <div className="space-y-1 text-xs">
                      <div><code>{'{{timestamp}}'}</code></div>
                      <div><code>{'{{metadata.*}}'}</code></div>
                      <div><code>{'{{raw.line}}'}</code></div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reference" className="mt-4">
                <div className="space-y-6">
              {/* Raw */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-sm">raw</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">raw.line</code>
                    <span className="text-xs text-muted-foreground">Raw IRC line</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">raw.timestamp</code>
                    <span className="text-xs text-muted-foreground">Raw timestamp string</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-sm">message</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">message.content</code>
                    <span className="text-xs text-muted-foreground">Message text</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">message.type</code>
                    <span className="text-xs text-muted-foreground">Message type</span>
                  </div>
                </div>
              </div>

              {/* Sender */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-sm">sender</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">sender.nickname</code>
                    <span className="text-xs text-muted-foreground">IRC nickname</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">sender.username</code>
                    <span className="text-xs text-muted-foreground">IRC username</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">sender.hostname</code>
                    <span className="text-xs text-muted-foreground">Sender hostname</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">sender.realname</code>
                    <span className="text-xs text-muted-foreground">Real name</span>
                  </div>
                </div>
              </div>

              {/* Target */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-semibold text-sm">target</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">target.name</code>
                    <span className="text-xs text-muted-foreground">Channel or user</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">target.type</code>
                    <span className="text-xs text-muted-foreground">Type (channel/user)</span>
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-orange-500" />
                  <h3 className="font-semibold text-sm">client</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">client.id</code>
                    <span className="text-xs text-muted-foreground">Client ID</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">client.type</code>
                    <span className="text-xs text-muted-foreground">Client type</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">client.name</code>
                    <span className="text-xs text-muted-foreground">Client name</span>
                  </div>
                </div>
              </div>

              {/* Server */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-red-500" />
                  <h3 className="font-semibold text-sm">server</h3>
                  <Badge variant="outline" className="text-xs">Object</Badge>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">server.id</code>
                    <span className="text-xs text-muted-foreground">Server ID</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">server.hostname</code>
                    <span className="text-xs text-muted-foreground">Server hostname</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">server.displayName</code>
                    <span className="text-xs text-muted-foreground">Display name</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">server.clientNickname</code>
                    <span className="text-xs text-muted-foreground">Bot's nickname</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">server.network</code>
                    <span className="text-xs text-muted-foreground">Network name</span>
                  </div>
                </div>
              </div>

              {/* Other Fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-500" />
                  <h3 className="font-semibold text-sm">Other Fields</h3>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">timestamp</code>
                    <span className="text-xs text-muted-foreground">Message timestamp (Date)</span>
                  </div>
                  <div className="flex items-start justify-between p-2 rounded bg-muted/50">
                    <code className="text-xs">metadata.*</code>
                    <span className="text-xs text-muted-foreground">Custom metadata fields</span>
                  </div>
                </div>
              </div>
            </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Usage Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Where Templates Are Used</CardTitle>
            <CardDescription>
              Templates work throughout your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Sink Templates</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Define notification titles and bodies with dynamic content
                </p>
                <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {`{\n  template: {\n    title: "[{{server.displayName}}]",\n    body: "{{message.content}}"\n  }\n}`}
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Event Metadata</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  All event metadata is processed recursively before sending to sinks
                </p>
                <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {`{\n  metadata: {\n    description: "Alert from {{server.displayName}}",\n    tags: ["user:{{sender.nickname}}"]\n  }\n}`}
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Filter Values</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dynamic filter matching using template variables
                </p>
                <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {`{\n  field: "message.content",\n  operator: "contains",\n  value: "{{server.clientNickname}}"\n}`}
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Regex Patterns</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use templates in regex patterns for dynamic matching
                </p>
                <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {`{\n  field: "message.content",\n  operator: "matches",\n  pattern: "@{{server.clientNickname}}\\\\b"\n}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior & Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Behavior & Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unknown Variables */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-sm">Unknown Variables</h3>
                  <p className="text-xs text-muted-foreground">
                    Variables that don't exist in the context are preserved unchanged. This helps with debugging.
                  </p>
                  <div className="p-3 bg-muted rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <code className="text-xs">{'{{unknown.field}}'}</code>
                      <span className="text-xs text-muted-foreground">→</span>
                      <code className="text-xs">{'{{unknown.field}}'}</code>
                      <span className="text-xs text-muted-foreground">(unchanged)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Null/Undefined Values */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-sm">Null & Undefined Values</h3>
                  <p className="text-xs text-muted-foreground">
                    Null and undefined values are treated as "not found" and left unchanged.
                  </p>
                  <div className="p-3 bg-muted rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <code className="text-xs">{'{{server.id}}'}</code>
                      <span className="text-xs text-muted-foreground">(if null) →</span>
                      <code className="text-xs">{'{{server.id}}'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <h3 className="font-semibold text-sm">Best Practices</h3>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Use descriptive variable names</div>
                    <div className="p-3 bg-muted rounded space-y-1">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        <code className="text-xs text-green-500">{'{{sender.nickname}} sent: {{message.content}}'}</code>
                      </div>
                      <div className="flex items-start gap-2">
                        <XCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                        <code className="text-xs text-red-500">{'{{data}} {{text}}'}</code>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium">Check for missing fields</div>
                    <p className="text-xs text-muted-foreground">
                      Test your templates with different message types to ensure fields exist.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium">Use deep processing for complex objects</div>
                    <p className="text-xs text-muted-foreground">
                      Event metadata is automatically processed recursively—templates work at any nesting level.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-World Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Real-World Examples</CardTitle>
            <CardDescription>
              Common template patterns for different use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notifications" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Simple Message Notification</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono">
                      {`title: "[{{server.displayName}}] {{sender.nickname}}"\nbody: "{{message.content}}"`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Result: <code className="px-1 py-0.5 bg-muted rounded">[Libera] alice</code> / <code className="px-1 py-0.5 bg-muted rounded">Hello everyone!</code>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Direct Message Alert</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono">
                      {`title: "DM from {{sender.nickname}}"\nbody: "{{message.content}}"\ntags: ["dm", "user:{{sender.nickname}}"]`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Includes sender nickname in both title and tags
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Mention Notification</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono">
                      {`title: "{{sender.nickname}} mentioned you in {{target.name}}"\nbody: "{{message.content}}"`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Shows who mentioned you and where
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Complex Nested Metadata</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono whitespace-pre">
{`metadata: {
  description: "Alert from {{server.displayName}}",
  sink: {
    ntfy: {
      title: "{{sender.nickname}} in {{target.name}}",
      tags: ["server:{{server.id}}", "user:{{sender.nickname}}"],
      priority: "high"
    },
    discord: {
      embedTitle: "Message on {{server.displayName}}",
      embedColor: 3447003
    }
  }
}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      All nested strings are processed recursively, numbers and booleans preserved
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Dynamic Bot Name Filter</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono whitespace-pre">
{`{
  field: "sender.nickname",
  operator: "in",
  value: ["{{server.clientNickname}}", "admin", "bot"]
}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Filter includes the bot's own nickname dynamically
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="font-semibold text-sm">Regex with Template</div>
                    <div className="p-3 bg-muted rounded text-xs font-mono whitespace-pre">
{`{
  field: "message.content",
  operator: "matches",
  pattern: "@{{server.clientNickname}}\\\\b"
}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Match mentions of the bot with word boundary
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Processing Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Flow</CardTitle>
            <CardDescription>
              How templates are resolved throughout the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-semibold text-sm shrink-0">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-sm">Message Received</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    IRC message arrives and is parsed into a MessageContext with all available fields
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-semibold text-sm shrink-0">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-sm">Event Matching</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Filter values and patterns are processed with templates before evaluation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 font-semibold text-sm shrink-0">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-sm">Metadata Processing</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Event metadata is recursively processed, resolving all templates at any nesting depth
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-semibold text-sm shrink-0">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-semibold text-sm">Sink Delivery</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sink templates are processed and notification is sent with fully resolved values
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Tricks */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Pro Tip:</strong> Templates preserve unknown variables like <code className="px-1 py-0.5 bg-muted rounded text-xs">{'{{missing.field}}'}</code> unchanged. 
            This makes it easy to spot configuration issues—if you see template syntax in your notifications, you know something's wrong!
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}
