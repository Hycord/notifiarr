'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

export default function TemplatingModal() {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl">Template System Guide</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          <div className="space-y-6">
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

            {/* Context Reference - moved just below Overview */}

            {/* Context Reference - Tabbed */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Message */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-green-500" />
                          <h3 className="font-semibold text-sm">message</h3>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="text-xs"><code>message.content</code> - Message text</div>
                          <div className="text-xs"><code>message.type</code> - Message type</div>
                        </div>
                      </div>

                      {/* Sender */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-purple-500" />
                          <h3 className="font-semibold text-sm">sender</h3>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="text-xs"><code>sender.nickname</code> - IRC nickname</div>
                          <div className="text-xs"><code>sender.username</code> - IRC username</div>
                          <div className="text-xs"><code>sender.hostname</code> - Sender hostname</div>
                        </div>
                      </div>

                      {/* Server */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-red-500" />
                          <h3 className="font-semibold text-sm">server</h3>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="text-xs"><code>server.id</code> - Server ID</div>
                          <div className="text-xs"><code>server.displayName</code> - Display name</div>
                          <div className="text-xs"><code>server.clientNickname</code> - Bot's nickname</div>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-500" />
                          <h3 className="font-semibold text-sm">client</h3>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="text-xs"><code>client.id</code> - Client ID</div>
                          <div className="text-xs"><code>client.type</code> - Client type</div>
                          <div className="text-xs"><code>client.name</code> - Client name</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reference" className="mt-4">
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                      {/* Raw */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <Database className="h-4 w-4 text-blue-500" />
                          <h3 className="font-semibold text-sm">raw</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{raw.line}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Raw IRC line</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{raw.timestamp}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Raw timestamp string</span>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <FileCode className="h-4 w-4 text-green-500" />
                          <h3 className="font-semibold text-sm">message</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{message.content}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Message text content</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{message.type}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Message type</span>
                          </div>
                        </div>
                      </div>

                      {/* Sender */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <FileCode className="h-4 w-4 text-purple-500" />
                          <h3 className="font-semibold text-sm">sender</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{sender.nickname}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">IRC nickname</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{sender.username}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">IRC username</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{sender.hostname}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Sender hostname</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{sender.realname}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Real name</span>
                          </div>
                        </div>
                      </div>

                      {/* Target */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <FileCode className="h-4 w-4 text-yellow-500" />
                          <h3 className="font-semibold text-sm">target</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{target.name}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Channel or user target</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{target.type}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Target type (channel/user)</span>
                          </div>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <Database className="h-4 w-4 text-orange-500" />
                          <h3 className="font-semibold text-sm">client</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{client.id}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Client ID</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{client.type}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Client type</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{client.name}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Client name</span>
                          </div>
                        </div>
                      </div>

                      {/* Server */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <Database className="h-4 w-4 text-red-500" />
                          <h3 className="font-semibold text-sm">server</h3>
                          <Badge variant="outline" className="text-xs">Object</Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{server.id}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Server ID</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{server.hostname}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Server hostname</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{server.displayName}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Display name</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{server.clientNickname}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Bot's IRC nickname</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{server.network}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Network name</span>
                          </div>
                        </div>
                      </div>

                      {/* Other Fields */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                          <Database className="h-4 w-4 text-cyan-500" />
                          <h3 className="font-semibold text-sm">Other Fields</h3>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{timestamp}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Message timestamp (Date)</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 p-2 rounded bg-muted/50">
                            <code className="text-xs font-mono whitespace-nowrap">{'{{metadata.*}}'}</code>
                            <span className="text-xs text-muted-foreground text-right">Custom metadata fields</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Syntax Guide - moved below Reference */}
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
                  
                  <TabsContent value="basic" className="space-y-3 mt-4">
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{sender}}'}</div>
                      <div className="text-xs text-muted-foreground">Access entire sender object</div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{message}}'}</div>
                      <div className="text-xs text-muted-foreground">Access entire message object</div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{timestamp}}'}</div>
                      <div className="text-xs text-muted-foreground">Access timestamp Date object</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="nested" className="space-y-3 mt-4">
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{sender.nickname}}'}</div>
                      <div className="text-xs text-muted-foreground">Sender's IRC nickname</div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{server.displayName}}'}</div>
                      <div className="text-xs text-muted-foreground">Server display name</div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-sm">{'{{message.content}}'}</div>
                      <div className="text-xs text-muted-foreground">Message text content</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-3 mt-4">
                    <div className="p-3 border rounded-lg space-y-1 overflow-x-auto">
                      <div className="font-mono text-sm text-green-500 whitespace-nowrap">
                        {'[{{server.displayName}}] {{sender.nickname}}'}
                      </div>
                      <div className="text-xs text-muted-foreground">→ [Libera] alice</div>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1 overflow-x-auto">
                      <div className="font-mono text-sm text-green-500 whitespace-nowrap">
                        {'Message from {{sender.nickname}} in {{target.name}}'}
                      </div>
                      <div className="text-xs text-muted-foreground">→ Message from alice in #general</div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Usage Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Where Templates Are Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-sm">Sink Templates</h3>
                    </div>
                    <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                      {`{\n  template: {\n    title: "[{{server.displayName}}]"\n  }\n}`}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-sm">Event Metadata</h3>
                    </div>
                    <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                      {`{\n  metadata: {\n    tags: ["user:{{sender.nickname}}"]\n  }\n}`}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-sm">Filter Values</h3>
                    </div>
                    <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                      {`{\n  field: "message.content",\n  value: "{{server.clientNickname}}"\n}`}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-sm">Regex Patterns</h3>
                    </div>
                    <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                      {`{\n  operator: "matches",\n  pattern: "@{{server.clientNickname}}\\\\b"\n}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Unknown Variables</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Variables that don't exist are preserved unchanged for debugging.
                      </p>
                      <div className="p-2 bg-muted rounded mt-2 overflow-x-auto">
                        <code className="text-xs whitespace-nowrap">{'{{unknown.field}}'}</code> → <code className="text-xs whitespace-nowrap">{'{{unknown.field}}'}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">Use Descriptive Names</h3>
                      <div className="p-2 bg-muted rounded mt-2 space-y-1 overflow-x-auto">
                        <div className="text-xs text-green-500 whitespace-nowrap">✓ {'{{sender.nickname}} sent: {{message.content}}'}</div>
                        <div className="text-xs text-red-500 whitespace-nowrap">✗ {'{{data}} {{text}}'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tip */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Pro Tip:</strong> Event metadata is automatically processed recursively—templates work at any nesting depth!
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
