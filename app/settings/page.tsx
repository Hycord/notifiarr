'use client';

import { AppLayout } from "@/components/app-layout";
import {
  useReloadConfig,
  useMainConfig,
  useUpdateMainConfig,
  useExportConfig,
  useImportConfig,
} from "@/hooks/use-config-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Download, Upload, Trash2, ClipboardCopy, FileDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RootConfigForm } from "@/components/forms/root-config-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { BLANK_CONFIG } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function SettingsPage() {
  const reloadConfig = useReloadConfig({
    onSuccess: (data) => {
      toast.success(
        `Configuration reloaded: ${data.summary.clients} clients, ${data.summary.servers} servers, ${data.summary.events} events, ${data.summary.sinks} sinks`
      );
    },
    onError: (error) => {
      toast.error(`Failed to reload configuration: ${error.message}`);
    },
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [exportBase64, setExportBase64] = useState("");
  const exportConfig = useExportConfig({
    onSuccess: async (blob) => {
      setExportBlob(blob);
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        setExportBase64(btoa(binary));
      } catch {
        setExportBase64("");
        toast.error("Failed to generate base64 preview");
      }
      setShowExportDialog(true);
      toast.success("Configuration exported");
    },
    onError: (error) => toast.error(`Failed to export configuration: ${error.message}`),
  });

  const importConfig = useImportConfig({
    onSuccess: () => {
      toast.success("Configuration imported successfully");
      setShowImportDialog(false);
      setImportFile(null);
      setImportMode("replace");
    },
    onError: (error) => toast.error(`Failed to import configuration: ${error.message}`),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [importTab, setImportTab] = useState<"file" | "base64">("file");
  const [importBase64, setImportBase64] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  const { data: mainConfig, isLoading: mainLoading } = useMainConfig();
  const updateMainConfig = useUpdateMainConfig({
    onSuccess: () => toast.success("Root configuration updated"),
    onError: (e) => toast.error(`Failed to update root config: ${e.message}`),
  });
  const [configTab, setConfigTab] = useState("form");
  const [codeContent, setCodeContent] = useState("");

  useEffect(() => {
    if (mainConfig) {
      setCodeContent(
        typeof mainConfig === "string" ? mainConfig : JSON.stringify(mainConfig, null, 2)
      );
    }
  }, [mainConfig]);

  const handleRootSaveCode = () => {
    try {
      updateMainConfig.mutate(JSON.parse(codeContent));
    } catch {
      toast.error("Root config JSON is invalid");
    }
  };

  const handleExport = () => exportConfig.mutate();
  const handleImportClick = () => {
    setShowImportDialog(true);
    setImportTab("file");
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFile(file);
  };

  const isValidBase64 = (value: string) => {
    const s = value.replace(/\s+/g, "");
    if (!s || s.length % 4 !== 0) return false;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return false;
    try {
      atob(s);
      return true;
    } catch {
      return false;
    }
  };

  const handleImportConfirm = async () => {
    try {
      if (importTab === "file") {
        if (!importFile) return toast.error("Please choose a file to import");
        await importConfig.mutateAsync({ file: importFile, mode: importMode });
      } else {
        const raw = importBase64.trim();
        if (!raw) return toast.error("Please paste base64 config text");
        const cleaned = raw.replace(/\s+/g, "");
        if (!isValidBase64(cleaned)) return toast.error("Invalid base64 content");
        const bin = atob(cleaned);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/gzip" });
        const file = new File([blob], "import-config.json.gz", { type: "application/gzip" });
        await importConfig.mutateAsync({ file, mode: importMode });
      }
      setShowImportDialog(false);
      setImportFile(null);
      setImportBase64("");
      setImportMode("replace");
    } catch (e: any) {
      toast.error(`Failed to import configuration: ${e?.message || String(e)}`);
    }
  };

  const handleClearConfirm = async () => {
    try {
      const bin = atob(BLANK_CONFIG);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/gzip" });
      const file = new File([blob], "blank-config.json.gz", { type: "application/gzip" });
      await importConfig.mutateAsync({ file, mode: "replace" });
      try { await reloadConfig.mutateAsync(); } catch {}
      setShowClearDialog(false);
      toast.success("Configuration cleared to blank");
    } catch (e: any) {
      toast.error(`Failed to clear configuration: ${e.message || String(e)}`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl px-4 sm:px-0">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground m-0">Manage global system settings and configuration</p>
        </div>

        <Tabs value={configTab} onValueChange={setConfigTab} className="space-y-6">
          <TabsList className="grid w-full sm:max-w-md grid-cols-2">
            <TabsTrigger value="form" className="text-xs sm:text-sm">Root Config Editor</TabsTrigger>
            <TabsTrigger value="code" className="text-xs sm:text-sm">Code View</TabsTrigger>
          </TabsList>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Toggle site theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <ThemeToggle variant="switch" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-muted-foreground m-0">Switch between light and dark mode</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <TabsContent value="form" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Root Configuration</CardTitle>
                <CardDescription>Manage global references & runtime settings</CardDescription>
              </CardHeader>
              <CardContent>
                {mainLoading && (
                  <p className="text-sm text-muted-foreground m-0">Loading root configuration…</p>
                )}
                {!mainLoading && (
                  <RootConfigForm
                    value={typeof mainConfig === "object" ? (mainConfig as any) : undefined}
                    isSubmitting={updateMainConfig.isPending}
                    onSubmit={(data) => updateMainConfig.mutate(data)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="code" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Root Config Code</CardTitle>
                <CardDescription>Edit raw JSON representation</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] sm:h-[500px] border-t">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={codeContent}
                    onChange={(v) => setCodeContent(v || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                    }}
                  />
                </div>
                <div className="flex gap-2 p-4">
                  <Button onClick={handleRootSaveCode} disabled={updateMainConfig.isPending}>
                    {updateMainConfig.isPending ? "Saving…" : "Save Root Config"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Management</CardTitle>
            <CardDescription>Reload, import, and export configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium m-0">Reload Configuration</h4>
                <p className="text-sm text-muted-foreground m-0">Force reload all configuration files from disk</p>
              </div>
              <Button onClick={() => reloadConfig.mutate()} disabled={reloadConfig.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${reloadConfig.isPending ? "animate-spin" : ""}`} />
                {reloadConfig.isPending ? "Reloading..." : "Reload Config"}
              </Button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <h4 className="font-medium m-0">Export Configuration</h4>
                <p className="text-sm text-muted-foreground m-0">Download all configurations as a JSON bundle</p>
              </div>
              <Button variant="outline" onClick={handleExport} disabled={exportConfig.isPending}>
                <Download className="mr-2 h-4 w-4" />
                {exportConfig.isPending ? "Exporting..." : "Export"}
              </Button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <h4 className="font-medium m-0">Import Configuration</h4>
                <p className="text-sm text-muted-foreground m-0">Upload and restore configuration bundle (.json or .json.gz)</p>
              </div>
              <Button variant="outline" onClick={handleImportClick} disabled={importConfig.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {importConfig.isPending ? "Importing..." : "Import"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.json.gz,application/json,application/gzip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <h4 className="font-medium m-0">Clear Configuration</h4>
                <p className="text-sm text-muted-foreground m-0">Replace all current configuration with a blank config</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
                disabled={importConfig.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {importConfig.isPending ? "Clearing…" : "Clear Config"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Backend API settings and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">API Endpoint</span>
              <span className="font-mono text-xs">
                {process.env.BACKEND_API_URL || "http://localhost:3000/api"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Authentication</span>
              <Badge variant="default">Bearer Token</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Application version and environment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span>0.1.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Environment</span>
              <Badge variant="secondary">{process.env.NODE_ENV}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Import a configuration bundle from file or base64.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant={importTab === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportTab("file")}
              >
                File
              </Button>
              <Button
                variant={importTab === "base64" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportTab("base64")}
              >
                Base64 Text
              </Button>
            </div>
            {importTab === "file" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={importConfig.isPending}
                  >
                    Choose File
                  </Button>
                  {importFile && (
                    <span className="text-sm">Selected: <strong>{importFile.name}</strong></span>
                  )}
                </div>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept=".json,.json.gz,application/json,application/gzip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
            {importTab === "base64" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground m-0">Paste base64 (.json.gz)</p>
                <textarea
                  value={importBase64}
                  onChange={(e) => setImportBase64(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border p-2 text-sm font-mono"
                  placeholder="H4sIA..."
                />
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm text-muted-foreground m-0">Or fetch from URL</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com/config.txt"
                      className="flex-1 rounded-md border p-2 text-sm"
                    />
                    <Button
                      variant="outline"
                      disabled={isFetchingUrl}
                      onClick={async () => {
                        if (!importUrl.trim()) return toast.error("Enter a URL to fetch");
                        try {
                          setIsFetchingUrl(true);
                          const endpoint = `/api/fetch-raw?url=${encodeURIComponent(importUrl.trim())}`;
                          const res = await fetch(endpoint);
                          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                          const text = await res.text();
                          const cleaned = text.trim().replace(/\s+/g, "");
                          if (!isValidBase64(cleaned)) return toast.error("Fetched content is not valid base64");
                          setImportBase64(cleaned);
                          toast.success("Loaded base64 from URL");
                        } catch (e: any) {
                          toast.error(`Failed to fetch URL: ${e.message || String(e)}`);
                        } finally {
                          setIsFetchingUrl(false);
                        }
                      }}
                    >
                      {isFetchingUrl ? "Fetching…" : "Fetch"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="font-medium m-0">Import mode:</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={(e) => setImportMode(e.target.value as "replace")}
                    className="h-4 w-4"
                  />
                  <div>
                    <span className="font-medium">Replace</span>
                    <p className="text-sm text-muted-foreground m-0">Replace all existing configurations</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={(e) => setImportMode(e.target.value as "merge")}
                    className="h-4 w-4"
                  />
                  <div>
                    <span className="font-medium">Merge</span>
                    <p className="text-sm text-muted-foreground m-0">Merge with existing (may conflict)</p>
                  </div>
                </label>
              </div>
            </div>
            {importMode === "replace" && (
              <p className="text-sm text-amber-600 dark:text-amber-500 m-0">
                Warning: This replaces all current configurations.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
                setImportBase64("");
                setImportMode("replace");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              disabled={importConfig.isPending}
            >
              {importConfig.isPending ? "Importing..." : "Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Configuration</AlertDialogTitle>
            <AlertDialogDescription>Choose an export method.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground m-0">Download or copy base64 backup.</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!exportBlob) return;
                  const url = window.URL.createObjectURL(exportBlob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `notifiarr-config-${new Date().toISOString().split("T")[0]}.json.gz`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
              >
                <FileDown className="mr-2 h-4 w-4" /> Download .json.gz
              </Button>
              <Button
                variant="outline"
                disabled={!exportBase64}
                onClick={async () => {
                  const value = exportBase64;
                  if (!value) return;
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(value);
                      toast.success("Base64 copied");
                      return;
                    }
                  } catch {}
                  try {
                    // @ts-ignore
                    if (window.ClipboardItem && navigator.clipboard?.write) {
                      // @ts-ignore
                      const item = new ClipboardItem({
                        "text/plain": new Blob([value], { type: "text/plain" }),
                      });
                      await navigator.clipboard.write([item]);
                      toast.success("Base64 copied");
                      return;
                    }
                  } catch {}
                  try {
                    const ta = document.createElement("textarea");
                    ta.value = value;
                    ta.readOnly = true;
                    ta.style.position = "fixed";
                    ta.style.top = "0";
                    ta.style.left = "0";
                    ta.style.width = "1px";
                    ta.style.height = "1px";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    const ok = document.execCommand("copy");
                    document.body.removeChild(ta);
                    if (ok) return toast.success("Base64 copied");
                  } catch {}
                  toast.error("Unable to copy. Select and copy manually.");
                }}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Base64
              </Button>
            </div>
            <div>
              <p className="text-sm mb-2 m-0">Base64 Preview</p>
              <textarea
                readOnly
                value={exportBase64}
                rows={6}
                className="w-full rounded-md border p-2 text-sm font-mono"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowExportDialog(false);
                setExportBlob(null);
                setExportBase64("");
              }}
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Configuration</AlertDialogTitle>
            <AlertDialogDescription>Replace all configuration with a blank template.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-amber-600 dark:text-amber-500 m-0">
              Warning: This action is destructive and cannot be undone.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearConfirm}
              disabled={importConfig.isPending}
            >
              {importConfig.isPending ? "Clearing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
                  <p className="text-sm mb-2 m-0">Base64 Preview</p>
